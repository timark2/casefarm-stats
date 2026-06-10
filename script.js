class CaseFarm {
    constructor() {
        this.isNW = typeof nw !== 'undefined';
        this.fs = null;
        this.dataPath = 'data/farm_data.json';
        
        this.cases = [];
        this.skins = [];
        this.accounts = [];
        this.costs = [];
        this.weeks = [];
        this.months = [];
        this.caseColors = {};
        
        this.chart = null;
        this.currentListType = 'cases';
        
        this.initFileSystem();
        this.init();
    }

    initFileSystem() {
        if (this.isNW) {
            try {
                this.fs = require('fs');
                this.path = require('path');
                this.loadDataFromFile();
                console.log('✅ NW.js режим: данные в файл');
            } catch (error) {
                console.error('Ошибка:', error);
                this.isNW = false;
                this.loadFromLocalStorageAll();
            }
        } else {
            console.log('⚠️ Браузерный режим');
            this.loadFromLocalStorageAll();
        }
    }

    loadDataFromFile() {
        try {
            if (!this.fs.existsSync('data')) {
                this.fs.mkdirSync('data');
                console.log('📁 Папка data создана');
            }
            
            if (this.fs.existsSync(this.dataPath)) {
                const rawData = this.fs.readFileSync(this.dataPath, 'utf8');
                const data = JSON.parse(rawData);
                
                this.cases = data.cases || [];
                this.skins = data.skins || [];
                this.accounts = data.accounts || [];
                this.costs = data.costs || [];
                this.weeks = data.weeks || [];
                this.months = data.months || [];
                this.caseColors = data.caseColors || {};
                
                console.log(`📂 Загружено: ${this.cases.length} кейсов`);
            }
        } catch (error) {
            console.error('Ошибка загрузки:', error);
            this.loadFromLocalStorageAll();
        }
    }

    saveDataToFile() {
        if (!this.isNW || !this.fs) return;
        
        try {
            const data = {
                cases: this.cases,
                skins: this.skins,
                accounts: this.accounts,
                costs: this.costs,
                weeks: this.weeks,
                months: this.months,
                caseColors: this.caseColors,
                lastSaved: new Date().toISOString()
            };
            
            this.fs.writeFileSync(this.dataPath, JSON.stringify(data, null, 2), 'utf8');
            console.log('💾 Данные сохранены в файл');
        } catch (error) {
            console.error('Ошибка сохранения:', error);
        }
    }

    loadFromLocalStorageAll() {
        this.cases = JSON.parse(localStorage.getItem('caseFarm_cases') || '[]');
        this.skins = JSON.parse(localStorage.getItem('caseFarm_skins') || '[]');
        this.accounts = JSON.parse(localStorage.getItem('caseFarm_accounts') || '[]');
        this.costs = JSON.parse(localStorage.getItem('caseFarm_costs') || '[]');
        this.weeks = JSON.parse(localStorage.getItem('caseFarm_weeks') || '[]');
        this.months = JSON.parse(localStorage.getItem('caseFarm_months') || '[]');
        this.caseColors = JSON.parse(localStorage.getItem('caseFarm_caseColors') || '{}');
    }

    saveAllToLocalStorage() {
        localStorage.setItem('caseFarm_cases', JSON.stringify(this.cases));
        localStorage.setItem('caseFarm_skins', JSON.stringify(this.skins));
        localStorage.setItem('caseFarm_accounts', JSON.stringify(this.accounts));
        localStorage.setItem('caseFarm_costs', JSON.stringify(this.costs));
        localStorage.setItem('caseFarm_weeks', JSON.stringify(this.weeks));
        localStorage.setItem('caseFarm_months', JSON.stringify(this.months));
        localStorage.setItem('caseFarm_caseColors', JSON.stringify(this.caseColors));
    }

    saveData() {
        if (this.isNW) {
            this.saveDataToFile();
        } else {
            this.saveAllToLocalStorage();
        }
    }

    exportData() {
        const data = {
            cases: this.cases,
            skins: this.skins,
            accounts: this.accounts,
            costs: this.costs,
            weeks: this.weeks,
            months: this.months,
            caseColors: this.caseColors,
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `casefarm_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        alert('✅ Данные экспортированы!');
    }

    importData(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                this.cases = data.cases || [];
                this.skins = data.skins || [];
                this.accounts = data.accounts || [];
                this.costs = data.costs || [];
                this.weeks = data.weeks || [];
                this.months = data.months || [];
                this.caseColors = data.caseColors || {};
                
                this.saveData();
                this.renderItemsList();
                this.updateStatistics();
                this.renderChart();
                this.updateMonthStatistics();
                this.updateCaseSelect();
                this.fixColors();
                
                alert('✅ Данные импортированы!');
            } catch (error) {
                alert('❌ Ошибка: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    showDataLocation() {
        if (this.isNW) {
            alert('📁 Данные сохраняются в файл:\ndata/farm_data.json\n\nВы можете скопировать этот файл для бэкапа.');
        } else {
            alert('🌐 Данные сохраняются в браузере (localStorage)\n\n⚠️ ВНИМАНИЕ: При очистке истории браузера данные будут потеряны!\n\nРекомендуется использовать экспорт данных для создания бэкапов.');
        }
    }

    init() {
        const today = new Date().toISOString().split('T')[0];
        const dateInputs = ['skinDate', 'accountDate', 'costDate'];
        dateInputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = today;
        });
        
        this.initTheme();
        this.updateCurrentWeek();
        this.renderItemsList();
        this.updateStatistics();
        this.renderChart();
        this.setupEventListeners();
        this.updateMonthStatistics();
        this.updateCaseSelect();
        this.fixColors();
    }

    initTheme() {
        const savedTheme = localStorage.getItem('caseFarm_theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
            themeToggle.addEventListener('click', () => {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('caseFarm_theme', newTheme);
                themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
            });
        }
    }

    setupEventListeners() {
        const caseForm = document.getElementById('caseForm');
        if (caseForm) {
            caseForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addCase();
            });
        }

        const skinForm = document.getElementById('skinForm');
        if (skinForm) {
            skinForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addSkin();
            });
        }

        const accountForm = document.getElementById('accountForm');
        if (accountForm) {
            accountForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addAccount();
            });
        }

        const costForm = document.getElementById('costForm');
        if (costForm) {
            costForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addCost();
            });
        }
    }

    updateCaseSelect() {
        const select = document.getElementById('caseSelect');
        if (!select) return;
        
        const uniqueNames = [...new Set(this.cases.map(c => c.name))];
        
        select.innerHTML = '<option value="">-- Выбрать кейс --</option>';
        
        uniqueNames.forEach(name => {
            const caseItem = this.cases.filter(c => c.name === name).pop();
            const color = (caseItem && caseItem.color && caseItem.color !== '#000000') ? caseItem.color : this.caseColors[name] || '#667eea';
            
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            option.style.backgroundColor = color;
            option.style.color = this.isColorDark(color) ? 'white' : 'black';
            select.appendChild(option);
        });
    }

    isColorDark(hexColor) {
        if (!hexColor || hexColor === '#000000') return true;
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness < 128;
    }

    selectCase() {
        const select = document.getElementById('caseSelect');
        const caseName = select.value;
        
        if (caseName) {
            const existingCase = this.cases.find(c => c.name === caseName);
            if (existingCase) {
                document.getElementById('caseName').value = caseName;
                const savedColor = this.caseColors[caseName] || existingCase.color || '#667eea';
                document.getElementById('caseColor').value = savedColor;
            }
        } else {
            document.getElementById('caseName').value = '';
            document.getElementById('caseColor').value = '#667eea';
        }
    }

    fixColors() {
        let fixed = 0;
        const colorPalette = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
            '#9966FF', '#FF9F40', '#8B4513', '#2E8B57',
            '#DA70D6', '#F0E68C', '#D2691E', '#FF69B4'
        ];
        
        this.cases.forEach(caseItem => {
            if (!caseItem.color || caseItem.color === '#000000') {
                caseItem.color = colorPalette[fixed % colorPalette.length];
                this.caseColors[caseItem.name] = caseItem.color;
                fixed++;
            } else if (this.caseColors[caseItem.name] !== caseItem.color && caseItem.color !== '#000000') {
                this.caseColors[caseItem.name] = caseItem.color;
                fixed++;
            }
        });
        
        if (fixed > 0) {
            this.saveData();
            this.renderChart();
            this.updateCaseSelect();
            console.log(`🔧 Исправлено цветов: ${fixed}`);
        }
    }

    getCurrentWeek() {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        
        let firstWednesday = new Date(startOfYear);
        while (firstWednesday.getDay() !== 3) {
            firstWednesday.setDate(firstWednesday.getDate() + 1);
        }
        
        if (now < firstWednesday) return 0;
        
        const diffTime = now - firstWednesday;
        const diffWeeks = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000));
        return diffWeeks + 1;
    }

    getWeekDates() {
        const now = new Date();
        const currentDay = now.getDay();
        
        let daysToWednesday;
        if (currentDay >= 3) {
            daysToWednesday = currentDay - 3;
        } else {
            daysToWednesday = 7 - (3 - currentDay);
        }
        
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - daysToWednesday);
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        
        return { start: startOfWeek, end: endOfWeek };
    }

    isDateInCurrentWeek(dateString) {
        const date = new Date(dateString);
        const weekDates = this.getWeekDates();
        return date >= weekDates.start && date <= weekDates.end;
    }

    getMonthName(month) {
        const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
        return months[month - 1] || 'Неизвестно';
    }

    updateCurrentWeek() {
        const weekNumber = this.getCurrentWeek();
        const weekDates = this.getWeekDates();
        
        const formatDate = (date) => date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
        
        const currentWeekEl = document.getElementById('currentWeek');
        if (currentWeekEl) {
            currentWeekEl.textContent = `Неделя ${weekNumber} (${formatDate(weekDates.start)} - ${formatDate(weekDates.end)})`;
        }
    }

    getCaseColor(caseName) {
        if (this.caseColors[caseName] && this.caseColors[caseName] !== '#000000') {
            return this.caseColors[caseName];
        }
        
        const existingCase = this.cases.find(c => c.name === caseName);
        if (existingCase && existingCase.color && existingCase.color !== '#000000') {
            this.caseColors[caseName] = existingCase.color;
            this.saveData();
            return existingCase.color;
        }
        
        const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#8B4513', '#2E8B57', '#DA70D6', '#F0E68C', '#D2691E', '#FF69B4'];
        const newColor = colors[Object.keys(this.caseColors).length % colors.length];
        this.caseColors[caseName] = newColor;
        this.saveData();
        return newColor;
    }

    addCase() {
        let name = document.getElementById('caseName').value;
        const selectedCase = document.getElementById('caseSelect').value;
        
        if (selectedCase && !name) name = selectedCase;
        
        if (!name) {
            alert('Введите название кейса или выберите из списка!');
            return;
        }
        
        const count = parseInt(document.getElementById('caseCount').value);
        const cost = parseFloat(document.getElementById('caseCost').value);
        let color = document.getElementById('caseColor').value;
        
        if (selectedCase && !document.getElementById('caseName').value) {
            const existingCase = this.cases.find(c => c.name === selectedCase);
            if (existingCase && existingCase.color && existingCase.color !== '#000000') {
                color = existingCase.color;
            } else if (this.caseColors[selectedCase] && this.caseColors[selectedCase] !== '#000000') {
                color = this.caseColors[selectedCase];
            }
        }
        
        if (!color || color === '#000000') {
            const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#8B4513', '#2E8B57', '#DA70D6', '#F0E68C', '#D2691E', '#FF69B4'];
            color = colors[Object.keys(this.caseColors).length % colors.length];
        }

        this.caseColors[name] = color;

        const caseItem = {
            id: Date.now(),
            name: name,
            count: count,
            cost: cost,
            color: color,
            date: new Date().toLocaleString('ru-RU'),
            dateISO: new Date().toISOString().split('T')[0],
            week: this.getCurrentWeek(),
            totalCost: count * cost
        };

        this.cases.push(caseItem);
        this.saveData();
        this.renderItemsList();
        this.updateStatistics();
        this.renderChart();
        this.updateCaseSelect();
        this.clearForm('caseForm');
        this.updateMonthStatistics();
        
        console.log('✅ Кейс добавлен:', name, 'Цвет:', color);
    }

    editCaseColor(caseId) {
        const caseItem = this.cases.find(c => c.id === caseId);
        if (!caseItem) return;
        
        const newColor = prompt(`Введите цвет для кейса "${caseItem.name}" в формате HEX (например, #FF5733):`, caseItem.color);
        
        if (newColor && /^#[0-9A-F]{6}$/i.test(newColor)) {
            caseItem.color = newColor;
            this.caseColors[caseItem.name] = newColor;
            this.saveData();
            this.renderItemsList();
            this.renderChart();
            this.updateCaseSelect();
            alert(`✅ Цвет кейса "${caseItem.name}" изменен!`);
        } else if (newColor) {
            alert('❌ Неверный формат цвета! Используйте HEX формат: #RRGGBB');
        }
    }

    addSkin() {
        const price = parseFloat(document.getElementById('skinPrice').value);
        const date = document.getElementById('skinDate').value;

        const skinItem = {
            id: Date.now(),
            price: price,
            date: date,
            dateISO: date,
            week: this.getCurrentWeek()
        };

        this.skins.push(skinItem);
        this.saveData();
        this.renderItemsList();
        this.updateStatistics();
        this.clearForm('skinForm');
        this.updateMonthStatistics();
    }

    addAccount() {
        const cost = parseFloat(document.getElementById('accountCost').value);
        const date = document.getElementById('accountDate').value;

        const accountItem = {
            id: Date.now(),
            cost: cost,
            date: date,
            dateISO: date,
            week: this.getCurrentWeek()
        };

        this.accounts.push(accountItem);
        this.saveData();
        this.renderItemsList();
        this.updateStatistics();
        this.clearForm('accountForm');
        this.updateMonthStatistics();
    }

    addCost() {
        const name = document.getElementById('costName').value;
        const amount = parseFloat(document.getElementById('costAmount').value);
        const date = document.getElementById('costDate').value;

        const costItem = {
            id: Date.now(),
            name: name,
            amount: amount,
            date: date,
            dateISO: date,
            week: this.getCurrentWeek()
        };

        this.costs.push(costItem);
        this.saveData();
        this.renderItemsList();
        this.updateStatistics();
        this.clearForm('costForm');
        this.updateMonthStatistics();
    }

    clearForm(formId) {
        document.getElementById(formId).reset();
        const today = new Date().toISOString().split('T')[0];
        if (formId === 'skinForm') {
            document.getElementById('skinDate').value = today;
        } else if (formId === 'accountForm') {
            document.getElementById('accountDate').value = today;
        } else if (formId === 'costForm') {
            document.getElementById('costDate').value = today;
        } else if (formId === 'caseForm') {
            const select = document.getElementById('caseSelect');
            if (select) select.value = '';
            document.getElementById('caseName').value = '';
            document.getElementById('caseColor').value = '#667eea';
            document.getElementById('caseCount').value = '';
            document.getElementById('caseCost').value = '';
        }
    }

    deleteCase(id) {
        if (confirm('Удалить этот кейс?')) {
            this.cases = this.cases.filter(item => item.id !== id);
            this.saveData();
            this.renderItemsList();
            this.updateStatistics();
            this.renderChart();
            this.updateCaseSelect();
            this.updateMonthStatistics();
        }
    }

    deleteSkin(id) {
        if (confirm('Удалить этот скин?')) {
            this.skins = this.skins.filter(item => item.id !== id);
            this.saveData();
            this.renderItemsList();
            this.updateStatistics();
            this.updateMonthStatistics();
        }
    }

    deleteAccount(id) {
        if (confirm('Удалить этот аккаунт?')) {
            this.accounts = this.accounts.filter(item => item.id !== id);
            this.saveData();
            this.renderItemsList();
            this.updateStatistics();
            this.updateMonthStatistics();
        }
    }

    deleteCost(id) {
        if (confirm('Удалить эту затрату?')) {
            this.costs = this.costs.filter(item => item.id !== id);
            this.saveData();
            this.renderItemsList();
            this.updateStatistics();
            this.updateMonthStatistics();
        }
    }

    saveWeek() {
        const weekNumber = this.getCurrentWeek();
        const year = new Date().getFullYear();
        
        const existingWeek = this.weeks.find(w => w.week === weekNumber && w.year === year);
        if (existingWeek) {
            if (!confirm(`Неделя ${weekNumber} уже сохранена. Перезаписать?`)) return;
            this.weeks = this.weeks.filter(w => !(w.week === weekNumber && w.year === year));
        }

        const weekStats = this.calculateWeeklyStats();
        const totalStats = this.calculateTotalStats();

        const weekData = {
            id: Date.now(),
            week: weekNumber,
            year: year,
            date: new Date().toLocaleString('ru-RU'),
            cases: this.cases.filter(c => this.isDateInCurrentWeek(c.dateISO)),
            skins: this.skins.filter(s => this.isDateInCurrentWeek(s.dateISO)),
            accounts: this.accounts.filter(a => this.isDateInCurrentWeek(a.dateISO)),
            costs: this.costs.filter(c => this.isDateInCurrentWeek(c.dateISO)),
            weekStatistics: weekStats,
            totalStatistics: totalStats
        };

        this.weeks.push(weekData);
        this.saveData();
        this.updateMonthStatistics();
        alert(`Неделя ${weekNumber} успешно сохранена!`);
    }

    calculateWeeklyStats() {
        const currentWeekCases = this.cases.filter(c => this.isDateInCurrentWeek(c.dateISO));
        const currentWeekSkins = this.skins.filter(s => this.isDateInCurrentWeek(s.dateISO));
        const currentWeekAccounts = this.accounts.filter(a => this.isDateInCurrentWeek(a.dateISO));
        const currentWeekCosts = this.costs.filter(c => this.isDateInCurrentWeek(c.dateISO));

        const totalWeekCases = currentWeekCases.reduce((sum, item) => sum + item.count, 0);
        const totalWeekCaseCost = currentWeekCases.reduce((sum, item) => sum + item.totalCost, 0);
        const totalWeekSkins = currentWeekSkins.reduce((sum, item) => sum + item.price, 0);
        const totalWeekAccountsCost = currentWeekAccounts.reduce((sum, item) => sum + item.cost, 0);
        const totalWeekAdditionalCosts = currentWeekCosts.reduce((sum, item) => sum + item.amount, 0);

        const weekProfit = totalWeekSkins + totalWeekCaseCost;
        const totalWeekExpenses = totalWeekAccountsCost + totalWeekAdditionalCosts;

        return { totalWeekCases, totalWeekCaseCost, totalWeekSkins, totalWeekAccounts: currentWeekAccounts.length, totalWeekAccountsCost, totalWeekAdditionalCosts, weekProfit, totalWeekExpenses };
    }

    calculateTotalStats() {
        const totalCases = this.cases.reduce((sum, item) => sum + item.count, 0);
        const totalCaseCost = this.cases.reduce((sum, item) => sum + item.totalCost, 0);
        const totalSkins = this.skins.reduce((sum, item) => sum + item.price, 0);
        const totalAccounts = this.accounts.length;
        const totalAccountsCost = this.accounts.reduce((sum, item) => sum + item.cost, 0);
        const totalAdditionalCosts = this.costs.reduce((sum, item) => sum + item.amount, 0);
        
        const totalAllTimeCosts = totalAccountsCost + totalAdditionalCosts;
        const totalProfit = (totalSkins + totalCaseCost) - totalAllTimeCosts;
        const profitPercentage = totalAllTimeCosts > 0 ? (totalProfit / totalAllTimeCosts * 100).toFixed(2) : 0;

        return { totalCases, totalCaseCost, totalSkins, totalAccounts, totalAccountsCost, totalAdditionalCosts, totalAllTimeCosts, totalProfit, profitPercentage };
    }

    updateMonthStatistics() {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();

        const monthCases = this.cases.filter(item => {
            const itemDate = new Date(item.dateISO);
            return itemDate.getMonth() + 1 === currentMonth && itemDate.getFullYear() === currentYear;
        });

        const monthSkins = this.skins.filter(item => {
            const itemDate = new Date(item.dateISO);
            return itemDate.getMonth() + 1 === currentMonth && itemDate.getFullYear() === currentYear;
        });

        const monthAccounts = this.accounts.filter(item => {
            const itemDate = new Date(item.dateISO);
            return itemDate.getMonth() + 1 === currentMonth && itemDate.getFullYear() === currentYear;
        });

        const monthCosts = this.costs.filter(item => {
            const itemDate = new Date(item.dateISO);
            return itemDate.getMonth() + 1 === currentMonth && itemDate.getFullYear() === currentYear;
        });

        const monthStats = {
            month: currentMonth,
            year: currentYear,
            totalCases: monthCases.reduce((sum, item) => sum + item.count, 0),
            totalCaseCost: monthCases.reduce((sum, item) => sum + item.totalCost, 0),
            totalSkins: monthSkins.reduce((sum, item) => sum + item.price, 0),
            totalAccounts: monthAccounts.length,
            totalAccountsCost: monthAccounts.reduce((sum, item) => sum + item.cost, 0),
            totalAdditionalCosts: monthCosts.reduce((sum, item) => sum + item.amount, 0),
            date: new Date().toLocaleString('ru-RU')
        };

        monthStats.totalProfit = (monthStats.totalSkins + monthStats.totalCaseCost) - (monthStats.totalAccountsCost + monthStats.totalAdditionalCosts);

        const existingMonth = this.months.find(m => m.month === currentMonth && m.year === currentYear);
        if (existingMonth) {
            Object.assign(existingMonth, monthStats);
        } else {
            monthStats.id = Date.now();
            this.months.push(monthStats);
        }

        this.saveData();
    }

    showWeekHistory() {
        const modalEl = document.getElementById('weekHistoryModal');
        if (!modalEl) return;
        
        const modal = new bootstrap.Modal(modalEl);
        const container = document.getElementById('weekHistoryList');

        if (this.weeks.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">Нет сохраненных недель</p>';
        } else {
            container.innerHTML = this.weeks.sort((a, b) => b.week - a.week).map(week => `
                <div class="card mb-3">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <div>
                            <h6>Неделя ${week.week}, ${week.year} год</h6>
                            <small class="text-muted">Сохранено: ${week.date}</small>
                        </div>
                        <button class="btn btn-sm btn-outline-primary" onclick="caseFarm.showWeekDetail(${week.id})">📋 Подробнее</button>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-4">
                                <small>🎁 Кейсы: ${week.weekStatistics.totalWeekCases}</small><br>
                                <small>💰 С кейсов: ${week.weekStatistics.totalWeekCaseCost.toFixed(2)} ₽</small><br>
                                <small>🔫 Скины: ${week.weekStatistics.totalWeekSkins.toFixed(2)} ₽</small>
                            </div>
                            <div class="col-md-4">
                                <small>👤 Аккаунты: ${week.weekStatistics.totalWeekAccounts}</small><br>
                                <small>💸 Затраты: ${week.weekStatistics.totalWeekAccountsCost.toFixed(2)} ₽</small><br>
                                <small>💸 Доп. затраты: ${week.weekStatistics.totalWeekAdditionalCosts.toFixed(2)} ₽</small>
                            </div>
                            <div class="col-md-4">
                                <small class="profit-positive">💰 Прибыль за неделю: +${week.weekStatistics.weekProfit.toFixed(2)} ₽</small><br>
                                <small class="${week.totalStatistics.totalProfit >= 0 ? 'profit-positive' : 'profit-negative'}">📈 Прибыль за все время: ${week.totalStatistics.totalProfit >= 0 ? '+' : ''}${week.totalStatistics.totalProfit.toFixed(2)} ₽</small>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        }
        modal.show();
    }

    showWeekDetail(weekId) {
        const week = this.weeks.find(w => w.id === weekId);
        if (!week) return;

        const modal = new bootstrap.Modal(document.getElementById('weekDetailModal'));
        document.getElementById('weekDetailTitle').textContent = `Детали недели ${week.week}, ${week.year} год`;
        document.getElementById('weekDetailContent').innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <div class="card"><div class="card-header"><h6>🎁 Кейсы за неделю</h6></div><div class="card-body week-details">${week.cases.length > 0 ? week.cases.map(c => `<div class="case-item mb-2"><div class="d-flex justify-content-between"><div class="d-flex align-items-center"><span class="color-preview" style="background-color: ${c.color}"></span><div><strong>${c.name}</strong><br><small>${c.count} шт. × ${c.cost} ₽ = ${c.totalCost} ₽</small></div></div><small>${c.date}</small></div></div>`).join('') : '<p class="text-muted text-center">Нет кейсов</p>'}</div></div>
                </div>
                <div class="col-md-6">
                    <div class="card"><div class="card-header"><h6>🔫 Скины за неделю</h6></div><div class="card-body week-details">${week.skins.length > 0 ? week.skins.map(s => `<div class="skin-item mb-2"><div><strong>Выбитый скин</strong><br><small>${s.price} ₽</small></div><small>${s.date}</small></div>`).join('') : '<p class="text-muted text-center">Нет скинов</p>'}</div></div>
                    <div class="card mt-3"><div class="card-header"><h6>👤 Аккаунты за неделю</h6></div><div class="card-body week-details">${week.accounts.length > 0 ? week.accounts.map(a => `<div class="account-item mb-2"><div><strong>Аккаунт</strong><br><small>${a.cost} ₽</small></div><small>${a.date}</small></div>`).join('') : '<p class="text-muted text-center">Нет аккаунтов</p>'}</div></div>
                    <div class="card mt-3"><div class="card-header"><h6>💸 Затраты за неделю</h6></div><div class="card-body week-details">${week.costs.length > 0 ? week.costs.map(c => `<div class="cost-item mb-2"><div><strong>${c.name}</strong><br><small>${c.amount} ₽</small></div><small>${c.date}</small></div>`).join('') : '<p class="text-muted text-center">Нет затрат</p>'}</div></div>
                </div>
            </div>
            <div class="row mt-4"><div class="col-12"><div class="card"><div class="card-header"><h6>📊 Итоги недели</h6></div><div class="card-body"><div class="row"><div class="col-md-3 text-center"><h5>${week.weekStatistics.totalWeekCases}</h5><small>Кейсов</small></div><div class="col-md-3 text-center"><h5 class="profit-positive">+${week.weekStatistics.totalWeekCaseCost.toFixed(2)} ₽</h5><small>С кейсов</small></div><div class="col-md-3 text-center"><h5 class="profit-positive">+${week.weekStatistics.totalWeekSkins.toFixed(2)} ₽</h5><small>Со скинов</small></div><div class="col-md-3 text-center"><h5 class="profit-positive">+${week.weekStatistics.weekProfit.toFixed(2)} ₽</h5><small>Общая прибыль</small></div></div></div></div></div></div>
        `;
        modal.show();
    }

    showMonthHistory() {
        const modal = new bootstrap.Modal(document.getElementById('monthHistoryModal'));
        const container = document.getElementById('monthHistoryList');

        if (this.months.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">Нет данных за месяцы</p>';
        } else {
            container.innerHTML = this.months.sort((a, b) => { if (a.year !== b.year) return b.year - a.year; return b.month - a.month; }).map(month => `
                <div class="card mb-3"><div class="card-header"><h6>${this.getMonthName(month.month)} ${month.year}</h6><small class="text-muted">Обновлено: ${month.date}</small></div><div class="card-body"><div class="row"><div class="col-md-4"><small>🎁 Кейсы: ${month.totalCases}</small><br><small>💰 С кейсов: ${month.totalCaseCost.toFixed(2)} ₽</small><br><small>🔫 Скины: ${month.totalSkins.toFixed(2)} ₽</small></div><div class="col-md-4"><small>👤 Аккаунты: ${month.totalAccounts}</small><br><small>💸 Затраты: ${month.totalAccountsCost.toFixed(2)} ₽</small><br><small>💸 Доп. затраты: ${month.totalAdditionalCosts.toFixed(2)} ₽</small></div><div class="col-md-4"><small class="${month.totalProfit >= 0 ? 'profit-positive' : 'profit-negative'}">💰 Прибыль за месяц: ${month.totalProfit >= 0 ? '+' : ''}${month.totalProfit.toFixed(2)} ₽</small><br><small>Общий доход: ${(month.totalSkins + month.totalCaseCost).toFixed(2)} ₽</small></div></div></div></div>
            `).join('');
        }
        modal.show();
    }

    renderItemsList() {
        const container = document.getElementById('itemsList');
        if (!container) return;
        
        const listType = this.currentListType;
        let items, emptyMessage, renderFunction;

        switch (listType) {
            case 'accounts':
                items = this.accounts;
                emptyMessage = 'Нет добавленных аккаунтов';
                renderFunction = this.renderAccountItem.bind(this);
                document.getElementById('listTitle').textContent = '👤 Аккаунты';
                break;
            case 'skins':
                items = this.skins;
                emptyMessage = 'Нет добавленных скинов';
                renderFunction = this.renderSkinItem.bind(this);
                document.getElementById('listTitle').textContent = '🔫 Выбитые скины';
                break;
            case 'costs':
                items = this.costs;
                emptyMessage = 'Нет добавленных затрат';
                renderFunction = this.renderCostItem.bind(this);
                document.getElementById('listTitle').textContent = '💸 Затраты';
                break;
            default:
                items = this.cases.filter(item => this.isDateInCurrentWeek(item.dateISO));
                emptyMessage = 'Нет кейсов за текущую неделю';
                renderFunction = this.renderCaseItem.bind(this);
                document.getElementById('listTitle').textContent = '🎁 Выбитые кейсы (текущая неделя)';
        }

        if (items.length === 0) {
            container.innerHTML = `<p class="text-muted text-center">${emptyMessage}</p>`;
            return;
        }

        const sortedItems = [...items].sort((a, b) => b.id - a.id);
        container.innerHTML = sortedItems.map(item => renderFunction(item)).join('');
    }

    renderCaseItem(item) {
        const color = item.color || this.getCaseColor(item.name);
        return `
            <div class="case-item">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="d-flex align-items-center">
                        <span class="color-preview" style="background-color: ${color}"></span>
                        <div>
                            <h6>${this.escapeHtml(item.name)}</h6>
                            <small class="text-muted">
                                Количество: ${item.count} | 
                                Стоимость: ${item.cost} ₽ |
                                Итого: ${item.totalCost} ₽
                            </small>
                            <br>
                            <small class="text-muted">${item.date} (Неделя ${item.week})</small>
                        </div>
                    </div>
                    <div class="text-end">
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="caseFarm.editCaseColor(${item.id})" title="Изменить цвет">
                            🎨
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="caseFarm.deleteCase(${item.id})">
                            🗑️ Удалить
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderSkinItem(item) {
        return `<div class="skin-item"><div class="d-flex justify-content-between align-items-start"><div><h6>🔫 Выбитый скин</h6><small class="text-muted">Стоимость: ${item.price} ₽</small><br><small class="text-muted">${item.date} (Неделя ${item.week})</small></div><div class="text-end"><button class="btn btn-sm btn-outline-danger" onclick="caseFarm.deleteSkin(${item.id})">🗑️ Удалить</button></div></div></div>`;
    }

    renderAccountItem(item) {
        return `<div class="account-item"><div class="d-flex justify-content-between align-items-start"><div><h6>👤 Аккаунт</h6><small class="text-muted">Стоимость: ${item.cost} ₽</small><br><small class="text-muted">${item.date} (Неделя ${item.week})</small></div><div class="text-end"><button class="btn btn-sm btn-outline-danger" onclick="caseFarm.deleteAccount(${item.id})">🗑️ Удалить</button></div></div></div>`;
    }

    renderCostItem(item) {
        return `<div class="cost-item"><div class="d-flex justify-content-between align-items-start"><div><h6>💸 ${this.escapeHtml(item.name)}</h6><small class="text-muted">Сумма: ${item.amount} ₽</small><br><small class="text-muted">${item.date} (Неделя ${item.week})</small></div><div class="text-end"><button class="btn btn-sm btn-outline-danger" onclick="caseFarm.deleteCost(${item.id})">🗑️ Удалить</button></div></div></div>`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    changeListType() {
        const listTypeSelect = document.getElementById('listType');
        if (listTypeSelect) {
            this.currentListType = listTypeSelect.value;
            this.renderItemsList();
        }
    }

    updateStatistics() {
        const weekStats = this.calculateWeeklyStats();
        const totalStats = this.calculateTotalStats();

        document.getElementById('totalAccounts').textContent = totalStats.totalAccounts;
        document.getElementById('totalCases').textContent = weekStats.totalWeekCases;
        document.getElementById('totalFreeSkins').textContent = weekStats.totalWeekSkins.toFixed(2) + ' ₽';
        document.getElementById('totalAdditionalCosts').textContent = totalStats.totalAllTimeCosts.toFixed(2) + ' ₽';
        document.getElementById('totalWeekCosts').textContent = weekStats.totalWeekExpenses.toFixed(2) + ' ₽';
        document.getElementById('weekProfit').textContent = '+' + weekStats.weekProfit.toFixed(2) + ' ₽';
        document.getElementById('totalProfit').textContent = (totalStats.totalProfit >= 0 ? '+' : '') + totalStats.totalProfit.toFixed(2) + ' ₽';
        document.getElementById('profitPercentage').textContent = totalStats.totalProfit >= 0 ? `+${totalStats.profitPercentage}%` : `${totalStats.profitPercentage}%`;
    }

    renderChart() {
        const canvas = document.getElementById('caseChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const currentWeekCases = this.cases.filter(c => this.isDateInCurrentWeek(c.dateISO));
        
        const caseStats = {};
        const backgroundColors = [];
        
        currentWeekCases.forEach(item => {
            if (!caseStats[item.name]) {
                caseStats[item.name] = 0;
                const color = item.color || this.caseColors[item.name] || '#667eea';
                backgroundColors.push(color);
            }
            caseStats[item.name] += item.count;
        });

        const labels = Object.keys(caseStats);
        const data = Object.values(caseStats);
        const total = data.reduce((sum, value) => sum + value, 0);
        const percentages = data.map(value => total > 0 ? ((value / total) * 100).toFixed(1) + '%' : '0%');
        const labelsWithPercentages = labels.map((label, index) => `${label} (${percentages[index]})`);

        if (this.chart) this.chart.destroy();

        if (labels.length > 0) {
            this.chart = new Chart(ctx, {
                type: 'pie',
                data: { labels: labelsWithPercentages, datasets: [{ data: data, backgroundColor: backgroundColors, borderWidth: 2, borderColor: '#fff' }] },
                options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true, pointStyle: 'circle' } }, tooltip: { callbacks: { label: function(context) { const label = context.label || ''; const value = context.parsed; const total = context.dataset.data.reduce((a, b) => a + b, 0); const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0; return `${label}: ${value} шт. (${percentage}%)`; } } } } }
            });
        } else {
            this.chart = new Chart(ctx, { type: 'pie', data: { labels: ['Нет данных'], datasets: [{ data: [1], backgroundColor: ['#C9CBCF'] }] }, options: { responsive: true, plugins: { legend: { position: 'bottom' } } } });
        }
    }
}

let caseFarm;
document.addEventListener('DOMContentLoaded', () => {
    caseFarm = new CaseFarm();
});