function renderDynamicModule(id) {
    const container = document.getElementById('form-container');
    const today = new Date().toISOString().split('T')[0];
    let html = `<div class="card"><h2 class="section-title">${translations[currentLang][id]}</h2>`;

    if (id === 'housekeeping') {
        html += `
            <div class="grid-form">
                <div class="field">
                    <label>Тип</label>
                    <select id="f_type" class="form-control" onchange="toggleHK(this.value)">
                        <option value="once">Днес / Еднократно</option>
                        <option value="period">За период</option>
                        <option value="future">Бъдеща заявка</option>
                    </select>
                </div>
                <div class="field"><label>Стая</label><input type="text" id="f_room" class="form-control"></div>
                <div class="field" id="hk_date_box"><label>Дата</label><input type="date" id="f_date" value="${today}" class="form-control"></div>
                <div class="field">
                    <label>Услуга</label>
                    <select id="f_service" class="form-control">
                        <option>Почистена стая</option>
                        <option>Мръсна стая</option>
                        <option>Не желае почистване</option>
                        <option>Минибар</option>
                        <option>Кошара</option>
                        <option>Доп. легло</option>
                        <option>Тоал. хартия</option>
                        <option>Други</option>
                    </select>
                </div>
                <div class="field full"><label>Коментар</label><textarea id="f_comments" class="form-control" rows="3" placeholder="Допълнителни бележки..."></textarea></div>
            </div>`;
    } else if (id === 'maintenance') {
        html += `
            <div class="grid-form">
                <div class="field"><label>Стая / Локация</label><input type="text" id="f_room" class="form-control"></div>
                <div class="field">
                    <label>Технически проблем</label>
                    <select id="f_service" class="form-control">
                        <option>Минибар шуми</option>
                        <option>Минибар не работи</option>
                        <option>Климатик шуми</option>
                        <option>Климатик не работи</option>
                        <option>Крушка - легло</option>
                        <option>Крушка - баня</option>
                        <option>Крушка - коридор</option>
                        <option>Сейф - батерии</option>
                        <option>Сейф - блокиран</option>
                        <option>Казанче</option>
                        <option>Теч</option>
                        <option>Асансьор / Lift</option>
                        <option>Други</option>
                    </select>
                </div>
                <div class="field full"><label>Описание на повредата</label><textarea id="f_desc" class="form-control" rows="3"></textarea></div>
                <div class="field full"><label>Коментар</label><textarea id="f_comments" class="form-control" rows="2" placeholder="Допълнителни бележки..."></textarea></div>
            </div>`;
    } else if (id === 'reception') {
        html += `
            <div class="grid-form">
                <div class="field">
                    <label>Тип</label>
                    <select id="f_type" class="form-control">
                        <option value="now">Сега / Днес</option>
                        <option value="future">Бъдеща заявка (събуждане и др.)</option>
                    </select>
                </div>
                <div class="field"><label>Стая</label><input type="text" id="f_room" class="form-control"></div>
                <div class="field">
                    <label>Услуга</label>
                    <select id="f_service" class="form-control">
                        <option>Събуждане ⏰</option>
                        <option>Трансфер / Такси 🚕</option>
                        <option>Оплакване ⚠️</option>
                        <option>Други</option>
                    </select>
                </div>
                <div class="field"><label>Дата</label><input type="date" id="f_date" value="${today}" class="form-control"></div>
                <div class="field"><label>Час</label><input type="time" id="f_time" class="form-control"></div>
                <div class="field full"><label>Коментар</label><textarea id="f_comments" class="form-control" rows="3" placeholder="Допълнителни бележки за гост / услуга..."></textarea></div>
            </div>`;
    } else if (id === 'restaurant') {
        html += `
            <div class="grid-form">
                <div class="field"><label>Дата</label><input type="date" id="f_date" value="${today}" class="form-control"></div>
                <div class="field"><label>Услуга</label><select id="f_service" class="form-control"><option>Ранна закуска</option><option>Късна вечеря</option><option>Други</option></select></div>
                <div class="field"><label>Възрастни</label><input type="number" id="f_adults" value="2" class="form-control"></div>
                <div class="field"><label>Деца</label><input type="number" id="f_kids" value="0" class="form-control"></div>
                <div class="field full"><label>Коментар</label><textarea id="f_comments" class="form-control" rows="2"></textarea></div>
            </div>`;
    } else if (id === 'handover') {
        html += `
            <div class="grid-form">
                <div class="field">
                    <label>Касова наличност (лв)</label>
                    <div class="money-input">
                        <input type="number" inputmode="decimal" step="0.01" id="f_cash" class="form-control money" placeholder="0.00">
                        <span class="currency">лв</span>
                    </div>
                    <div class="money-chips">
                        <button type="button" class="money-chip" onclick="addMoney('f_cash', 10)">+10</button>
                        <button type="button" class="money-chip" onclick="addMoney('f_cash', 20)">+20</button>
                        <button type="button" class="money-chip" onclick="addMoney('f_cash', 50)">+50</button>
                        <button type="button" class="money-chip" onclick="addMoney('f_cash', 100)">+100</button>
                        <button type="button" class="money-chip" onclick="addMoney('f_cash', 500)">+500</button>
                        <button type="button" class="money-chip clear" onclick="clearMoney('f_cash')">Изчисти</button>
                    </div>
                </div>
                <div class="field">
                    <label>По карта (лв)</label>
                    <div class="money-input">
                        <input type="number" inputmode="decimal" step="0.01"