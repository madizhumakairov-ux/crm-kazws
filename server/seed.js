const db = require('./db');
const bcrypt = require('bcryptjs');

console.log('🌱 Seeding database for KAZWS CRM...');

// Clear existing data
db.exec(`
  DELETE FROM comments;
  DELETE FROM interactions;
  DELETE FROM tasks;
  DELETE FROM deals;
  DELETE FROM contacts;
  DELETE FROM companies;
  DELETE FROM users;
  DELETE FROM pipeline_stages;
`);

// Create admin user
const adminPassword = bcrypt.hashSync('admin123', 10);
const userPassword = bcrypt.hashSync('user123', 10);
db.prepare('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)').run('admin', 'admin@kazws.kz', adminPassword, 'admin');
db.prepare('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)').run('manager', 'manager@kazws.kz', userPassword, 'user');

// Create companies — real KAZWS client industries
const companies = [
  { name: 'ТОО Атырауский мясокомбинат', industry: 'Пищевая промышленность', website: 'https://meat-atyrau.kz', phone: '+77011001100', email: 'info@meat-atyrau.kz', address: 'г. Атырау, промзона' },
  { name: 'АО КарьерТрансГрупп', industry: 'Горнодобыча', website: 'https://ktg.kz', phone: '+77012002200', email: 'info@ktg.kz', address: 'г. Актобе, ул. Промышленная 12' },
  { name: 'ТОО КазДорСтрой', industry: 'Дорожное строительство', website: 'https://kazdorstroy.kz', phone: '+77013003300', email: 'info@kazdorstroy.kz', address: 'г. Атырау, пр. Абілқайыр хан 50' },
  { name: 'ТОО ЖилКомфорт', industry: 'ЖКХ / УК', website: 'https://zhilkomfort.kz', phone: '+77014004400', email: 'info@zhilkomfort.kz', address: 'г. Атырау, мкр. Нурсая 15' },
  { name: 'ТОО КазОйлПроцессинг', industry: 'Нефтегазовая', website: 'https://kazoil.kz', phone: '+77015005500', email: 'info@kazoil.kz', address: 'г. Атырау, ЗИП' },
  { name: 'ТОО АгроАтырау', industry: 'Сельское хозяйство', website: 'https://agro-atyrau.kz', phone: '+77016006600', email: 'info@agro-atyrau.kz', address: 'Атырауская обл., с. Махамбет' },
  { name: 'ТОО КаспийГидроСтрой', industry: 'Промышленное строительство', website: 'https://kaspigydro.kz', phone: '+77017007700', email: 'info@kaspigydro.kz', address: 'г. Актау, 14 мкр' },
  { name: 'ТОО МангистауВодоканал', industry: 'Водоснабжение', website: 'https://mangvodokanal.kz', phone: '+77018008800', email: 'info@mangvodokanal.kz', address: 'г. Актау, ул.Ленина 3' },
];

const insertCompany = db.prepare('INSERT INTO companies (name, industry, website, phone, email, address) VALUES (?, ?, ?, ?, ?, ?)');
const companyIds = [];
for (const c of companies) {
  const r = insertCompany.run(c.name, c.industry, c.website, c.phone, c.email, c.address);
  companyIds.push(r.lastInsertRowid);
}

// Create contacts
const contacts = [
  { first_name: 'Арман', last_name: 'Сериков', email: 'arman@meat-atyrau.kz', phone: '+77011111111', position: 'Главный инженер', company_id: companyIds[0], tags: '["engineer","decision-maker"]' },
  { first_name: 'Дина', last_name: 'Калиева', email: 'dina@meat-atyrau.kz', phone: '+77012222222', position: 'Директор производства', company_id: companyIds[0], tags: '["production","decision-maker"]' },
  { first_name: 'Ерлан', last_name: 'Мухамедов', email: 'erlan@ktg.kz', phone: '+77013333333', position: 'Директор по закупкам', company_id: companyIds[1], tags: '["procurement","decision-maker"]' },
  { first_name: 'Айгуль', last_name: 'Нурланова', email: 'aigul@kazdorstroy.kz', phone: '+77014444444', position: 'Эколог', company_id: companyIds[2], tags: '["ecology"]' },
  { first_name: 'Бауржан', last_name: 'Токтаров', email: 'bauka@zhilkomfort.kz', phone: '+77015555555', position: 'Управляющий директор', company_id: companyIds[3], tags: '["ceo","decision-maker"]' },
  { first_name: 'Сауле', last_name: 'Жумабаева', email: 'saule@kazoil.kz', phone: '+77016666666', position: 'Начальник экологической службы', company_id: companyIds[4], tags: '["ecology","hse"]' },
  { first_name: 'Руслан', last_name: 'Кенжебаев', email: 'ruslan@agro-atyrau.kz', phone: '+77017777777', position: 'Генеральный директор', company_id: companyIds[5], tags: '["ceo","decision-maker"]' },
  { first_name: 'Мадина', last_name: 'Оразова', email: 'madina@kaspigydro.kz', phone: '+77018888888', position: 'Главный инженер проектов', company_id: companyIds[6], tags: '["engineering"]' },
  { first_name: 'Тимур', last_name: 'Ахметов', email: 'timur@mangvodokanal.kz', phone: '+77019999999', position: 'Технический директор', company_id: companyIds[7], tags: '["technical","decision-maker"]' },
  { first_name: 'Жанна', last_name: 'Касымова', email: 'zhanna@ecoprojekt.kz', phone: '+77010000000', position: 'Проектировщик (субподряд)', company_id: null, tags: '["subcontractor","design"]' },
];

const insertContact = db.prepare('INSERT INTO contacts (first_name, last_name, email, phone, position, company_id, tags) VALUES (?, ?, ?, ?, ?, ?, ?)');
const contactIds = [];
for (const c of contacts) {
  const r = insertContact.run(c.first_name, c.last_name, c.email, c.phone, c.position, c.company_id, c.tags);
  contactIds.push(r.lastInsertRowid);
}

// Create deals — KAZWS equipment types
const deals = [
  { title: 'Очистные сооружения для мясокомбината', value: 45000000, stage: 'proposal', contact_id: contactIds[0], company_id: companyIds[0] },
  { title: 'Ливневая канализация — карьер', value: 28000000, stage: 'negotiation', contact_id: contactIds[2], company_id: companyIds[1] },
  { title: 'Очистка стоков с мостов и дорог', value: 18500000, stage: 'won', contact_id: contactIds[3], company_id: companyIds[2], closed_at: '2026-06-15' },
  { title: 'Биологические очистные — ЖК Нурсая', value: 35000000, stage: 'qualified', contact_id: contactIds[4], company_id: companyIds[3] },
  { title: 'Промышленные стоки — НПЗ', value: 62000000, stage: 'new', contact_id: contactIds[5], company_id: companyIds[4] },
  { title: 'Ёмкости для хранения стоков — ферма', value: 12000000, stage: 'proposal', contact_id: contactIds[6], company_id: companyIds[5] },
  { title: 'Очистные для ГОК — промстоки', value: 55000000, stage: 'negotiation', contact_id: contactIds[7], company_id: companyIds[6] },
  { title: 'Модернизация очистных — водоканал', value: 48000000, stage: 'qualified', contact_id: contactIds[8], company_id: companyIds[7] },
  { title: 'Ливневые очистные — ТРЦ', value: 15000000, stage: 'new', contact_id: contactIds[4], company_id: companyIds[3] },
  { title: 'Резервуары из стеклопластика', value: 9500000, stage: 'won', contact_id: contactIds[2], company_id: companyIds[1], closed_at: '2026-07-20' },
  { title: 'Очистные — база отдыха Каспий', value: 22000000, stage: 'lost', contact_id: contactIds[7], company_id: companyIds[6], closed_at: '2026-05-10' },
  { title: 'Промышленные очистные — цех', value: 38000000, stage: 'won', contact_id: contactIds[0], company_id: companyIds[0], closed_at: '2026-08-01' },
];

const insertDeal = db.prepare('INSERT INTO deals (title, value, stage, contact_id, company_id, closed_at) VALUES (?, ?, ?, ?, ?, ?)');
const dealIds = [];
for (const d of deals) {
  const r = insertDeal.run(d.title, d.value, d.stage, d.contact_id, d.company_id, d.closed_at || null);
  dealIds.push(r.lastInsertRowid);
}

// Create tasks
const tasks = [
  { title: 'Подготовить опросный лист — мясокомбинат', description: 'Собрать данные по объёмам стоков, составу, режиму работы', due_date: '2026-08-30', priority: 'high', status: 'in_progress', contact_id: contactIds[0], deal_id: dealIds[0] },
  { title: 'Выезд на объект — карьер', description: 'Замер, фото, обсуждение с заказчиком', due_date: '2026-08-25', priority: 'high', status: 'pending', contact_id: contactIds[2], deal_id: dealIds[1] },
  { title: 'Отправить КП — ЖК Нурсая', description: 'Коммерческое предложение на биологические очистные', due_date: '2026-08-28', priority: 'medium', status: 'pending', contact_id: contactIds[4], deal_id: dealIds[3] },
  { title: 'Звонок — эколог НПЗ', description: 'Уточнить требования к промышленным стокам', due_date: '2026-08-24', priority: 'high', status: 'pending', contact_id: contactIds[5], deal_id: dealIds[4] },
  { title: 'Подготовить проектную документацию', description: 'Рабочий проект для водоканала', due_date: '2026-09-01', priority: 'medium', status: 'pending', contact_id: contactIds[8], deal_id: dealIds[7] },
  { title: 'Согласовать субподряд — проектирование', description: 'Договор с Жанной на проектирование', due_date: '2026-08-26', priority: 'low', status: 'done', contact_id: contactIds[9], deal_id: null },
  { title: 'Переговоры по цене — ГОК', description: 'Обсуждение скидки на большой объём', due_date: '2026-08-27', priority: 'high', status: 'in_progress', contact_id: contactIds[7], deal_id: dealIds[6] },
  { title: 'Договор на ёмкости — ферма', description: 'Финализировать договор поставки', due_date: '2026-08-29', priority: 'medium', status: 'pending', contact_id: contactIds[6], deal_id: dealIds[5] },
];

const insertTask = db.prepare('INSERT INTO tasks (title, description, due_date, priority, status, contact_id, deal_id) VALUES (?, ?, ?, ?, ?, ?, ?)');
for (const t of tasks) {
  insertTask.run(t.title, t.description, t.due_date, t.priority, t.status, t.contact_id, t.deal_id);
}

// Create interactions
const interactions = [
  { type: 'call', subject: 'Звонок — мясокомбинат', description: 'Обсудили требования к очистным. Нужна производительность 500 м³/сут.', contact_id: contactIds[0], deal_id: dealIds[0], user_id: 1, date: '2026-08-20 10:00:00' },
  { type: 'email', subject: 'Отправка КП — ливневые', description: 'КП на ливневую канализацию для карьера отправлено', contact_id: contactIds[2], deal_id: dealIds[1], user_id: 1, date: '2026-08-19 14:30:00' },
  { type: 'meeting', subject: 'Выезд на объект — дороги', description: 'Осмотрели мост, согласовали точку подключения', contact_id: contactIds[3], deal_id: dealIds[2], user_id: 2, date: '2026-08-18 11:00:00' },
  { type: 'note', subject: 'Заметка — ЖК Нурсая', description: 'УК заинтересована, просят презентацию для совета', contact_id: contactIds[4], deal_id: dealIds[3], user_id: 1, date: '2026-08-17 16:00:00' },
  { type: 'call', subject: 'Звонок — эколог НПЗ', description: 'Обсудили нормативы сброса, нужны промышленные очистные', contact_id: contactIds[5], deal_id: dealIds[4], user_id: 2, date: '2026-08-16 09:30:00' },
  { type: 'email', subject: 'Подтверждение — дороги', description: 'Акт приёмки подписан, оплата получена', contact_id: contactIds[3], deal_id: dealIds[2], user_id: 1, date: '2026-08-15 13:00:00' },
  { type: 'meeting', subject: 'Презентация — водоканал', description: 'Показали кейсы модернизации, заинтересованы', contact_id: contactIds[8], deal_id: dealIds[7], user_id: 1, date: '2026-08-14 15:00:00' },
  { type: 'call', subject: 'Звонок — ГОК', description: 'Уточнили объёмы промстоков, нужна предочистка', contact_id: contactIds[7], deal_id: dealIds[6], user_id: 2, date: '2026-08-13 10:30:00' },
  { type: 'note', subject: 'Итоги месяца', description: 'Закрыли 2 сделки на 57.5 млн тенге. Конверсия растёт.', contact_id: null, deal_id: null, user_id: 1, date: '2026-08-12 17:00:00' },
  { type: 'email', subject: 'Гарантийное обслуживание', description: 'Напоминание о ТО очистных — дороги', contact_id: contactIds[3], deal_id: dealIds[2], user_id: 2, date: '2026-08-11 11:00:00' },
];

const insertInteraction = db.prepare('INSERT INTO interactions (type, subject, description, contact_id, deal_id, user_id, date) VALUES (?, ?, ?, ?, ?, ?, ?)');
for (const i of interactions) {
  insertInteraction.run(i.type, i.subject, i.description, i.contact_id, i.deal_id, i.user_id, i.date);
}

// Create pipeline stages
const stages = [
  { name: 'new', color: '#3B82F6', position: 1, is_default: 1 },
  { name: 'qualified', color: '#8B5CF6', position: 2, is_default: 0 },
  { name: 'proposal', color: '#EAB308', position: 3, is_default: 0 },
  { name: 'negotiation', color: '#F97316', position: 4, is_default: 0 },
  { name: 'won', color: '#22C55E', position: 5, is_default: 0 },
  { name: 'lost', color: '#EF4444', position: 6, is_default: 0 },
];

const insertStage = db.prepare('INSERT INTO pipeline_stages (name, color, position, is_default) VALUES (?, ?, ?, ?)');
for (const s of stages) {
  insertStage.run(s.name, s.color, s.position, s.is_default);
}

// Create sample comments
const comments = [
  { entity_type: 'deal', entity_id: dealIds[0], user_id: 1, text: 'Заказчик заинтересован в модульной системе. Нужно подготовить варианты комплектации.' },
  { entity_type: 'deal', entity_id: dealIds[0], user_id: 2, text: 'Провели встречу, обсудили сроки поставки. Клиент хочет запуск до конца года.' },
  { entity_type: 'deal', entity_id: dealIds[1], user_id: 1, text: 'Отправили КП на ливневую канализацию. Ждём обратную связь.' },
  { entity_type: 'deal', entity_id: dealIds[4], user_id: 2, text: 'Первичный звонок с экологом НПЗ. Требуются промышленные очистные с предочисткой.' },
  { entity_type: 'deal', entity_id: dealIds[6], user_id: 1, text: 'ГОК готов к переговорам по цене при объёме от 3 установок.' },
];

const insertComment = db.prepare('INSERT INTO comments (entity_type, entity_id, user_id, text) VALUES (?, ?, ?, ?)');
for (const c of comments) {
  insertComment.run(c.entity_type, c.entity_id, c.user_id, c.text);
}

console.log('✅ Seed data inserted successfully!');
console.log(`   - ${companies.length} companies (meat plant, quarry, roads, housing, oil, agriculture, construction, water utility)`);
console.log(`   - ${contacts.length} contacts`);
console.log(`   - ${deals.length} deals (wastewater treatment equipment)`);
console.log(`   - ${tasks.length} tasks`);
console.log(`   - ${interactions.length} interactions`);
console.log(`   - ${stages.length} pipeline stages`);
console.log(`   - ${comments.length} comments`);
console.log('   - 2 users (admin/admin123, manager/user123)');
