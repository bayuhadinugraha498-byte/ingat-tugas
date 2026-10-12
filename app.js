
(() => {
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  const STORAGE_KEY = "ingattugas-tasks-v1";

  // Mengambil tanggal hari ini
  function todayISO() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  // Contoh tugas yang muncul saat pertama kali membuka web
  function datePlus(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);

    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  const starterTasks = [
    {
      id: "demo1",
      title: "Selesaikan tugas Pemrograman Web",
      description: "Rapikan halaman sebelum dikumpulkan.",
      category: "Kuliah",
      priority: "Tinggi",
      date: datePlus(0),
      time: "20:00",
      done: false
    },
    {
      id: "demo2",
      title: "Rapat koordinasi organisasi",
      description: "Siapkan poin pembahasan untuk rapat.",
      category: "Organisasi",
      priority: "Sedang",
      date: datePlus(1),
      time: "16:00",
      done: false
    },
    {
      id: "demo3",
      title: "Baca materi pertemuan berikutnya",
      description: "Luangkan waktu untuk belajar.",
      category: "Kuliah",
      priority: "Rendah",
      date: datePlus(3),
      time: "",
      done: false
    }
  ];

  let tasks = [];

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    tasks = saved ? JSON.parse(saved) : starterTasks;

    if (!Array.isArray(tasks)) tasks = starterTasks;
  } catch (error) {
    tasks = starterTasks;
  }

  let currentFilter = "all";
  let currentCategory = "";
  let currentPriority = "all";
  let sortAscending = true;

  const dialog = $("#taskDialog");

  // Mengamankan teks sebelum dimasukkan ke HTML
  function escapeHTML(text = "") {
    return String(text).replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  // Format tanggal Indonesia
  function formatDate(value, options = {
    day: "numeric",
    month: "short",
    year: "numeric"
  }) {
    if (!value) return "Tanpa deadline";

    return new Date(value + "T12:00:00")
      .toLocaleDateString("id-ID", options);
  }

  // Simpan data tugas
  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      alert("Data gagal disimpan. Periksa pengaturan browser.");
      console.error(error);
    }
  }

  // Menampilkan notifikasi
  function showToast(message) {
    const toast = $("#toast");
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
      toast.classList.remove("show");
    }, 2300);
  }

  function activeTasks() {
    return tasks.filter(task => !task.done);
  }

  // Filter tugas berdasarkan menu, kategori, prioritas, dan pencarian
  function getVisibleTasks() {
    const searchInput = $("#searchInput");
    const query = searchInput
      ? searchInput.value.trim().toLowerCase()
      : "";

    return tasks.filter(task => {
      if (
        currentFilter === "today" &&
        (task.date !== todayISO() || task.done)
      ) return false;

      if (
        currentFilter === "upcoming" &&
        (task.date <= todayISO() || task.done)
      ) return false;

      if (currentFilter === "done" && !task.done) {
        return false;
      }

      if (currentFilter === "all" && task.done) {
        return false;
      }

      if (
        currentCategory &&
        task.category !== currentCategory
      ) return false;

      if (
        currentPriority !== "all" &&
        task.priority !== currentPriority
      ) return false;

      const text = [
        task.title,
        task.description,
        task.category,
        task.priority
      ].join(" ").toLowerCase();

      return text.includes(query);
    }).sort((a, b) => {
      const order = sortAscending ? 1 : -1;

      return order * (
        (a.date || "9999-12-31").localeCompare(
          b.date || "9999-12-31"
        ) ||
        (a.time || "").localeCompare(b.time || "")
      );
    });
  }

  // Menampilkan daftar tugas
  function renderTasks() {
    const list = $("#taskList");
    const emptyState = $("#emptyState");
    const items = getVisibleTasks();

    list.innerHTML = items.map(task => {
      const overdue =
        !task.done &&
        task.date &&
        task.date < todayISO();

      const priorityClass =
        task.priority === "Tinggi" ? "high" :
        task.priority === "Sedang" ? "medium" : "low";

      const dateLabel = overdue
        ? "Terlambat · "
        : task.date === todayISO()
          ? "Hari ini · "
          : "";

      return `
        <article class="task-item ${task.done ? "completed" : ""}">
          <input
            class="task-check"
            type="checkbox"
            data-complete="${escapeHTML(task.id)}"
            aria-label="Tandai tugas selesai"
            ${task.done ? "checked" : ""}
          >

          <div class="task-body">
            <h3 class="task-title">${escapeHTML(task.title)}</h3>

            ${task.description
              ? `<p class="task-desc">${escapeHTML(task.description)}</p>`
              : ""}

            <div class="task-meta">
              <span class="tag ${escapeHTML(task.category)}">
                ${escapeHTML(task.category)}
              </span>

              <span class="priority-label">
                <span class="priority-dot ${priorityClass}"></span>
                ${escapeHTML(task.priority)}
              </span>

              <span class="deadline ${overdue ? "overdue" : ""}">
                ◷ ${dateLabel}${formatDate(task.date, {
                  day: "numeric",
                  month: "short"
                })}
                ${task.time ? " · " + escapeHTML(task.time) : ""}
              </span>
            </div>
          </div>

          <div class="task-actions">
            <button
              type="button"
              class="icon-btn"
              data-edit="${escapeHTML(task.id)}"
            >Edit</button>

            <button
              type="button"
              class="icon-btn"
              data-delete="${escapeHTML(task.id)}"
            >Hapus</button>
          </div>
        </article>
      `;
    }).join("");

    list.hidden = items.length === 0;

    if (emptyState) {
      emptyState.hidden = items.length > 0;
    }

    const titles = {
      all: "Daftar Tugas",
      today: "Deadline Hari Ini",
      upcoming: "Tugas Akan Datang",
      done: "Tugas Selesai"
    };

    $("#listTitle").textContent = currentCategory
      ? "Kategori " + currentCategory
      : titles[currentFilter] || "Daftar Tugas";

    $("#allCount").textContent = activeTasks().length;

    $("#todayCount").textContent =
      activeTasks().filter(task => task.date === todayISO()).length;
  }

  // Menghitung statistik tugas
  function renderStats() {
    const active = activeTasks();
    const done = tasks.filter(task => task.done).length;
    const total = tasks.length;

    $("#statTotal").textContent = active.length;

    $("#statToday").textContent =
      active.filter(task => task.date === todayISO()).length;

    $("#statDone").textContent = done;

    $("#statTotalNote").textContent = active.length
      ? "Tetap fokus, satu per satu"
      : "Semua tugas sudah selesai!";

    const percent = total
      ? Math.round(done / total * 100)
      : 0;

    $("#donePercent").textContent =
      percent + "% dari seluruh tugas";

    $("#progressText").textContent = percent + "%";
    $("#progressBar").style.width = percent + "%";
    $("#progressDone").textContent = done + " selesai";
    $("#progressRemaining").textContent = active.length + " tersisa";
  }

  // Menampilkan agenda terdekat
  function renderAgenda() {
    const agenda = $("#agendaList");

    const upcoming = activeTasks()
      .filter(task => task.date && task.date >= todayISO())
      .sort((a, b) =>
        a.date.localeCompare(b.date) ||
        (a.time || "").localeCompare(b.time || "")
      )
      .slice(0, 4);

    agenda.innerHTML = upcoming.length
      ? upcoming.map(task => {
          const date = new Date(task.date + "T12:00:00");

          return `
            <div class="agenda-item">
              <div class="agenda-date">
                <strong>${date.getDate()}</strong>
                <small>${date.toLocaleDateString("id-ID", {
                  month: "short"
                })}</small>
              </div>

              <div class="agenda-info">
                <strong>${escapeHTML(task.title)}</strong>
                <small>
                  ${escapeHTML(task.category)}
                  ${task.time ? " · " + escapeHTML(task.time) : ""}
                </small>
              </div>
            </div>
          `;
        }).join("")
      : '<div class="agenda-empty">Belum ada agenda mendatang.</div>';
  }

  function render() {
    renderTasks();
    renderStats();
    renderAgenda();
  }

  // Membuka form tambah tugas
  function openNewTask() {
    $("#taskForm").reset();
    $("#taskId").value = "";
    $("#taskDate").value = todayISO();
    $("#taskPriority").value = "Sedang";
    $("#dialogTitle").textContent = "Tambah Tugas Baru";

    dialog.showModal();
    $("#taskTitle").focus();
  }

  // Membuka form edit tugas
  function openEditTask(id) {
    const task = tasks.find(item => item.id === id);
    if (!task) return;

    $("#taskId").value = task.id;
    $("#taskTitle").value = task.title;
    $("#taskDescription").value = task.description || "";
    $("#taskCategory").value = task.category;
    $("#taskPriority").value = task.priority;
    $("#taskDate").value = task.date;
    $("#taskTime").value = task.time || "";

    $("#dialogTitle").textContent = "Edit Tugas";
    dialog.showModal();
  }

  // Tombol tambah tugas
  $("#addTaskTop").addEventListener("click", openNewTask);
  $("#emptyAdd").addEventListener("click", openNewTask);

  // Tutup form
  $("#closeDialog").addEventListener("click", () => dialog.close());
  $("#cancelDialog").addEventListener("click", () => dialog.close());

  // Menyimpan tugas
  $("#taskForm").addEventListener("submit", event => {
    event.preventDefault();

    const title = $("#taskTitle").value.trim();
    const date = $("#taskDate").value;

    if (!title || !date) {
      alert("Nama tugas dan deadline wajib diisi.");
      return;
    }

    const id = $("#taskId").value || "task-" + Date.now();
    const oldTask = tasks.find(task => task.id === id);

    const newTask = {
      id,
      title,
      description: $("#taskDescription").value.trim(),
      category: $("#taskCategory").value,
      priority: $("#taskPriority").value,
      date,
      time: $("#taskTime").value,
      done: oldTask ? oldTask.done : false
    };

    if (oldTask) {
      tasks = tasks.map(task =>
        task.id === id ? newTask : task
      );
    } else {
      tasks.push(newTask);
    }

    saveTasks();
    render();
    dialog.close();

    showToast(oldTask
      ? "Tugas berhasil diperbarui!"
      : "Tugas berhasil ditambahkan!");
  });

  // Menandai tugas selesai
  $("#taskList").addEventListener("change", event => {
    const checkbox = event.target.closest("[data-complete]");
    if (!checkbox) return;

    const task = tasks.find(
      item => item.id === checkbox.dataset.complete
    );

    if (task) {
      task.done = checkbox.checked;
      saveTasks();
      render();

      showToast(task.done
        ? "Tugas berhasil diselesaikan!"
        : "Tugas dikembalikan ke daftar aktif.");
    }
  });

  // Edit dan hapus tugas
  $("#taskList").addEventListener("click", event => {
    const editButton = event.target.closest("[data-edit]");
    const deleteButton = event.target.closest("[data-delete]");

    if (editButton) {
      openEditTask(editButton.dataset.edit);
    }

    if (deleteButton) {
      const task = tasks.find(
        item => item.id === deleteButton.dataset.delete
      );

      if (task && confirm('Hapus tugas "' + task.title + '"?')) {
        tasks = tasks.filter(item => item.id !== task.id);
        saveTasks();
        render();
        showToast("Tugas berhasil dihapus.");
      }
    }
  });

  // Navigasi menu dan kategori
  $$(".nav-item").forEach(button => {
    button.addEventListener("click", () => {
      currentFilter = button.dataset.filter || "all";
      currentCategory = button.dataset.category || "";

      $$(".nav-item").forEach(item => {
        item.classList.toggle("active", item === button);
      });

      $$(".pill").forEach(item => {
        item.classList.toggle(
          "active",
          item.dataset.priority === "all"
        );
      });

      currentPriority = "all";
      renderTasks();
    });
  });

  // Filter prioritas
  $$(".pill").forEach(button => {
    button.addEventListener("click", () => {
      currentPriority = button.dataset.priority;

      $$(".pill").forEach(item => {
        item.classList.toggle("active", item === button);
      });

      renderTasks();
    });
  });

  // Pencarian
  $("#searchInput").addEventListener("input", renderTasks);

  // Urutkan deadline terdekat atau terjauh
  $("#sortButton").addEventListener("click", () => {
    sortAscending = !sortAscending;

    $("#sortButton").textContent = sortAscending
      ? "↕ Deadline terdekat"
      : "↕ Deadline terjauh";

    renderTasks();
  });

  // Tanggal hari ini
  $("#todayDate").textContent =
    new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });

  // Tampilkan data saat halaman dibuka
  render();
})();

