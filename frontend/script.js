/* frontend/script.js
   Versão corrigida e compatível com o index.html fornecido:
   - usa #taskForm (submit)
   - usa #tasksContainer para renderizar
   - inicializa flatpickr
   - garante que date nunca fique "undefined"
   - atualiza gráfico Chart.js conforme tema
*/

const usersUrl = "http://localhost:3001/users";
const tasksUrl = "http://localhost:3002/tasks";

let chartInstance = null;
let usersCache = [];

// referências DOM (serão definidas ao DOMContentLoaded)
let userSelect, taskForm, taskInput, taskDate, tasksContainer, messageEl, chartCanvas;

function showMessage(text, isError = false) {
  if (!messageEl) return;
  messageEl.textContent = text;
  messageEl.style.color = isError ? "#f87171" : "#34d399"; // vermelho/verde
  if (text) setTimeout(() => { messageEl.textContent = ""; }, 3500);
}

async function fetchUsers() {
  try {
    const res = await fetch(usersUrl);
    if (!res.ok) throw new Error("Erro ao buscar usuários");
    usersCache = await res.json();
    userSelect.innerHTML = usersCache.map(u => `<option value="${u.id}">${escapeHtml(u.name)}</option>`).join("");
  } catch (err) {
    console.error("fetchUsers:", err);
    showMessage("Não foi possível carregar usuários (verifique se a Users API está rodando)", true);
  }
}

async function fetchTasks() {
  try {
    const res = await fetch(tasksUrl);
    if (!res.ok) throw new Error("Erro ao buscar tarefas");
    const tasks = await res.json();
    renderTasks(tasks);
    updateChart(tasks);
  } catch (err) {
    console.error("fetchTasks:", err);
    showMessage("Não foi possível carregar tarefas (verifique se a Tasks API está rodando)", true);
  }
}

function escapeHtml(s='') {
  return String(s)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');
}

// render cards compactos (usa usersCache para nome do usuário)
function renderTasks(tasks) {
  tasksContainer.innerHTML = "";

  if (!tasks || tasks.length === 0) {
    tasksContainer.innerHTML = `<p class="text-gray-400 dark:text-gray-600 text-sm">Nenhuma tarefa encontrada.</p>`;
    return;
  }

  tasks.forEach(task => {
    const user = usersCache.find(u => u.id === task.userId);

    const card = document.createElement("div");
    card.className = "p-3 rounded-lg shadow-md bg-gray-800 dark:bg-gray-200 text-gray-100 dark:text-gray-900 flex justify-between items-center gap-2 transition transform hover:scale-105 hover:shadow-lg animate-fadeIn text-sm";

    const desc = document.createElement("div");
    const dateText = task.date ? task.date : "Sem data";
    desc.innerHTML = `<span class="font-medium">${escapeHtml(task.description)}</span><br>
      <span class="text-gray-400 dark:text-gray-600 text-xs">Usuário: ${user ? escapeHtml(user.name) : 'Desconhecido'}</span> ·
      <span class="text-gray-400 dark:text-gray-600 text-xs">📅 ${escapeHtml(dateText)}</span>`;

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "px-2 py-1 rounded-md bg-red-600 hover:bg-red-500 text-white shadow transition transform hover:scale-110 text-sm";
    delBtn.innerText = "🗑";
    delBtn.addEventListener("click", async () => {
      try {
        const res = await fetch(`${tasksUrl}/${task.id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Erro ao deletar");
        showMessage("Tarefa excluída");
        await fetchTasks();
      } catch (err) {
        console.error("deleteTask:", err);
        showMessage("Erro ao excluir tarefa", true);
      }
    });

    card.appendChild(desc);
    card.appendChild(delBtn);
    tasksContainer.appendChild(card);
  });
}

async function updateChart(tasksFetched) {
  try {
    // usersCache já carregado; recompute counts
    const users = usersCache;
    const tasks = tasksFetched || (await (await fetch(tasksUrl)).json());
    const counts = users.map(u => tasks.filter(t => t.userId === u.id).length);

    const ctx = chartCanvas.getContext("2d");
    if (chartInstance) chartInstance.destroy();

    const isDark = document.body.classList.contains("dark");

    // build colors array repeating if needed
    const baseColorsDark = ["rgba(99,102,241,0.8)", "rgba(16,185,129,0.8)", "rgba(239,68,68,0.8)", "rgba(234,179,8,0.8)"];
    const baseColorsLight = ["rgba(79,70,229,0.9)", "rgba(5,150,105,0.9)", "rgba(220,38,38,0.9)", "rgba(202,138,4,0.9)"];
    const base = isDark ? baseColorsDark : baseColorsLight;
    const backgroundColor = users.map((_, i) => base[i % base.length]);

    chartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: users.map(u => u.name),
        datasets: [{
          label: "Nº de tarefas",
          data: counts,
          backgroundColor,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            ticks: { color: isDark ? "#e5e7eb" : "#111827" },
            grid: { color: isDark ? "#374151" : "#d1d5db" }
          },
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, color: isDark ? "#e5e7eb" : "#111827" },
            grid: { color: isDark ? "#374151" : "#d1d5db" }
          }
        }
      }
    });
  } catch (err) {
    console.error("updateChart:", err);
    // não bloquear se o chart falhar
  }
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const description = taskInput.value.trim();
  const userId = parseInt(userSelect.value, 10) || (usersCache[0] && usersCache[0].id);
  // garante data válida: utiliza valor do flatpickr ou hoje
  const chosen = taskDate.value;
  const date = chosen && chosen.trim() ? chosen : new Date().toISOString().split("T")[0];

  if (!description) {
    showMessage("Digite uma descrição", true);
    return;
  }

  const body = { userId, description, date };

  try {
    const res = await fetch(tasksUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error("Erro ao criar tarefa");
    showMessage("Tarefa adicionada");
    // limpar campos
    taskInput.value = "";
    if (taskDate._flatpickr) taskDate._flatpickr.clear();
    await fetchTasks();
  } catch (err) {
    console.error("createTask:", err);
    showMessage("Erro ao adicionar tarefa", true);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  // capturar referências DOM (certeza de existência)
  userSelect = document.getElementById("userSelect");
  taskForm = document.getElementById("taskForm");
  taskInput = document.getElementById("taskInput");
  taskDate = document.getElementById("taskDate");
  tasksContainer = document.getElementById("tasksContainer");
  messageEl = document.getElementById("message");
  chartCanvas = document.getElementById("tasksChart");

  // inicializar flatpickr (apenas se elemento existir)
  if (taskDate) {
    flatpickr(taskDate, {
      dateFormat: "Y-m-d",
      allowInput: true
      // tema do flatpickr CSS não trocamos aqui; usamos css padrão
    });
  }

  // eventos
  if (taskForm) taskForm.addEventListener("submit", handleFormSubmit);

  // carregar dados
  await fetchUsers();
  await fetchTasks();

  // escuta mudança de tema (se toggle externo alterar classe body)
  const observer = new MutationObserver(() => updateChart());
  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
});
