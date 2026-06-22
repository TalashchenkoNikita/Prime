/* ── CONFIG ──────────────────────────────────────────
   Налаштуйте під свій розклад:
   - workDays: дні тижня (0=нд, 1=пн, ..., 6=сб)
   - timeSlots: доступні години прийому
   - bookedSlots: вже зайняті слоти (формат "YYYY-MM-DD HH:MM")
──────────────────────────────────────────────────── */
const CONFIG = {
  workDays: [1, 2, 3, 4, 5],          // Пн–Пт
  timeSlots: [
    "09:00","09:30","10:00","10:30","11:00","11:30",
    "12:00","13:00","13:30","14:00","14:30","15:00",
    "15:30","16:00","16:30","17:00","17:30"
  ],
  bookedSlots: [
    // Приклад: "2025-06-10 10:00", "2025-06-10 11:00"
  ]
};

/* ── STATE ──────────────────────────────────────── */
let currentDate  = new Date();
let selectedDate = null;
let selectedTime = null;

const monthNames = [
  "Січень","Лютий","Березень","Квітень","Травень","Червень",
  "Липень","Серпень","Вересень","Жовтень","Листопад","Грудень"
];
const dayNames = ["Понеділок","Вівторок","Середа","Четвер","П'ятниця","Субота","Неділя"];

/* ── CALENDAR ────────────────────────────────────── */
function renderCalendar() {
  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();

  document.getElementById("monthLabel").textContent =
    `${monthNames[month]} ${year}`;

  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  // Convert Sunday-based to Monday-based
  const startOffset = (firstDay + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const today = new Date();
  today.setHours(0,0,0,0);

  const grid = document.getElementById("calendarDays");
  grid.innerHTML = "";

  // Empty cells before first day
  for (let i = 0; i < startOffset; i++) {
    const el = document.createElement("div");
    el.className = "cal-day empty";
    grid.appendChild(el);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const el   = document.createElement("div");
    el.className = "cal-day";
    el.textContent = d;

    const isToday    = date.toDateString() === today.toDateString();
    const isPast     = date < today;
    const isWorkDay  = CONFIG.workDays.includes(date.getDay());
    const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();

    if (isToday)    el.classList.add("today");
    if (isSelected) el.classList.add("selected");

    if (isPast || !isWorkDay) {
      el.classList.add("disabled");
    } else {
      el.addEventListener("click", () => selectDate(date));
    }

    grid.appendChild(el);
  }
}

function selectDate(date) {
  selectedDate = date;
  selectedTime = null;
  updateSummary();
  renderCalendar();
  renderTimeSlots(date);
}

/* ── TIMESLOTS ────────────────────────────────────── */
function renderTimeSlots(date) {
  const section = document.getElementById("timeslotsSection");
  const grid    = document.getElementById("timeslotsGrid");
  const label   = document.getElementById("selectedDateLabel");

  const day = date.getDay(); // 0=Sun
  const dayIndex = (day + 6) % 7; // Mon=0
  label.textContent = `— ${dayNames[dayIndex]}, ${date.getDate()} ${monthNames[date.getMonth()]}`;

  grid.innerHTML = "";
  section.style.display = "block";

  const dateStr = formatDate(date);

  CONFIG.timeSlots.forEach(time => {
    const el = document.createElement("div");
    el.className = "timeslot";
    el.textContent = time;

    const key = `${dateStr} ${time}`;
    if (CONFIG.bookedSlots.includes(key)) {
      el.classList.add("booked");
    } else {
      el.addEventListener("click", () => selectTime(time, el));
    }

    grid.appendChild(el);
  });
}

function selectTime(time, el) {
  document.querySelectorAll(".timeslot").forEach(t => t.classList.remove("selected"));
  el.classList.add("selected");
  selectedTime = time;
  updateSummary();
}

/* ── FORM & SUMMARY ──────────────────────────────── */
function updateSummary() {
  const summary    = document.getElementById("selectedSummary");
  const summaryTxt = document.getElementById("summaryText");
  const submitBtn  = document.getElementById("submitBtn");
  const hiddenDate = document.getElementById("hiddenDate");
  const hiddenTime = document.getElementById("hiddenTime");

  if (selectedDate && selectedTime) {
    const day = selectedDate.getDay();
    const di  = (day + 6) % 7;
    const dateLabel = `${dayNames[di]}, ${selectedDate.getDate()} ${monthNames[selectedDate.getMonth()]} — ${selectedTime}`;
    summaryTxt.textContent = dateLabel;
    summary.style.display  = "flex";
    submitBtn.disabled     = false;
    hiddenDate.value = formatDate(selectedDate);
    hiddenTime.value = selectedTime;
  } else {
    summary.style.display = "none";
    submitBtn.disabled    = true;
    hiddenDate.value = "";
    hiddenTime.value = "";
  }
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/* ── FORM SUBMIT ─────────────────────────────────── */
document.getElementById("bookingForm").addEventListener("submit", async function(e) {
  e.preventDefault();

  const btn = document.getElementById("submitBtn");
  btn.textContent = "Надсилаємо...";
  btn.disabled = true;

  const formData = new FormData(this);

  try {
    const res = await fetch(this.action, {
      method: "POST",
      body: formData,
      headers: { "Accept": "application/json" }
    });

    if (res.ok) {
      document.getElementById("bookingForm").style.display    = "none";
      document.getElementById("successMessage").style.display = "flex";
    } else {
      btn.textContent = "Записатися на прийом";
      btn.disabled = false;
      alert("Помилка надсилання. Будь ласка, спробуйте ще раз або зателефонуйте нам.");
    }
  } catch {
    btn.textContent = "Записатися на прийом";
    btn.disabled = false;
    alert("Помилка з'єднання. Перевірте інтернет та спробуйте ще раз.");
  }
});

/* ── RESET ───────────────────────────────────────── */
function resetForm() {
  selectedDate = null;
  selectedTime = null;
  document.getElementById("bookingForm").reset();
  document.getElementById("bookingForm").style.display    = "flex";
  document.getElementById("successMessage").style.display = "none";
  document.getElementById("timeslotsSection").style.display = "none";
  document.getElementById("selectedSummary").style.display  = "none";
  document.getElementById("submitBtn").disabled = true;
  renderCalendar();
}

/* ── NAV BUTTONS ─────────────────────────────────── */
document.getElementById("prevMonth").addEventListener("click", () => {
  const today = new Date(); today.setHours(0,0,0,0);
  const prev  = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  // Don't go before current month
  if (prev >= new Date(today.getFullYear(), today.getMonth(), 1)) {
    currentDate = prev;
    renderCalendar();
  }
});

document.getElementById("nextMonth").addEventListener("click", () => {
  currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  renderCalendar();
});

/* ── INIT ─────────────────────────────────────────── */
renderCalendar();
