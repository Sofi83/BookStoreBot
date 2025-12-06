// ============================================
// УСТАНОВКА: npm install node-telegram-bot-api
// ============================================

const TelegramBot = require('node-telegram-bot-api');

// Замените YOUR_BOT_TOKEN на токен от @BotFather
const token = 'YOUR_BOT_TOKEN';
const bot = new TelegramBot(token, { polling: true });

// ID администратора (получите через @userinfobot)
const ADMIN_ID = 'YOUR_ADMIN_TELEGRAM_ID';

// Хранилище заказов (в реальном проекте используйте базу данных)
const orders = {};

// ============================================
// КАТАЛОГ КНИГ
// ============================================
const books = [
  {
    id: 1,
    title: 'Я ведьма. Жизнь До и После...',
    author: 'Автор',
    price: 500,
    available: true,
    driveLinks: {
      pdf: 'https://drive.google.com/file/d/1C2aCMZifPJMErlbTZ5BTqJomjj-w30lA/view?usp=share_link',
      epub: 'https://drive.google.com/file/d/1vUj_MsZqrZjVS67n1pVOSbZ4w0dBdGrT/view?usp=share_link'
    }
  },
  {
    id: 2,
    title: 'Где живет твой Демон?!',
    author: 'Автор',
    price: 500,
    available: true,
    driveLinks: {
      pdf: 'https://drive.google.com/file/d/1QRi7ZeJwuQ81K9L2eeY_cTZRuy4WNw56/view?usp=share_link'
    }
  },
  {
    id: 3,
    title: 'Книга современной ведьМы',
    author: 'Автор',
    price: 500,
    available: true,
    driveLinks: {
      pdf: 'https://drive.google.com/file/d/1wTGjTeOQyV_NS76kVjUq9LZ848PBEDjC/view?usp=share_link'
    }
  },
  {
    id: 4,
    title: 'Карфаген',
    author: 'Автор',
    price: 500,
    available: false, // Скоро выход
    driveLinks: {}
  }
];

// ============================================
// КОМАНДА /start - ПРИВЕТСТВИЕ
// ============================================
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.first_name;

  const welcomeText = `
Добро пожаловать, ${userName}! 📚✨

Это книжная витрина магических книг. Здесь вы можете приобрести книги в электронном формате.

Нажмите кнопку ниже, чтобы посмотреть каталог.
  `;

  const keyboard = {
    inline_keyboard: [
      [{ text: '📖 Показать витрину', callback_data: 'show_catalog' }]
    ]
  };

  bot.sendMessage(chatId, welcomeText, { reply_markup: keyboard });
});

// ============================================
// ПОКАЗАТЬ КАТАЛОГ
// ============================================
function showCatalog(chatId) {
  let catalogText = '📚 *Наш каталог книг:*\n\n';

  books.forEach(book => {
    catalogText += `*${book.id}. "${book.title}"*\n`;
    catalogText += `💰 Цена: ${book.price} руб.\n`;
    if (!book.available) {
      catalogText += `⏳ _Скоро в продаже_\n`;
    }
    catalogText += `\n`;
  });

  const keyboard = {
    inline_keyboard: books
      .filter(book => book.available) // Показываем только доступные книги
      .map(book => [
        { text: `📖 ${book.title}`, callback_data: `book_${book.id}` }
      ])
  };

  bot.sendMessage(chatId, catalogText, {
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });
}

// ============================================
// ВЫБОР КНИГИ И ФОРМАТА
// ============================================
function showBookDetails(chatId, bookId) {
  const book = books.find(b => b.id === bookId);

  if (!book) {
    bot.sendMessage(chatId, '❌ Книга не найдена');
    return;
  }

  if (!book.available) {
    bot.sendMessage(chatId, '⏳ Эта книга скоро появится в продаже. Следите за обновлениями!');
    return;
  }

  const bookText = `
📚 *${book.title}*
💰 Цена: ${book.price} руб.

Выберите формат книги:
  `;

  // Создаем кнопки только для доступных форматов
  const formatButtons = [];
  
  if (book.driveLinks.pdf) {
    formatButtons.push([{ text: '📱 PDF', callback_data: `format_${bookId}_pdf` }]);
  }
  if (book.driveLinks.epub) {
    formatButtons.push([{ text: '📖 EPUB', callback_data: `format_${bookId}_epub` }]);
  }
  if (book.driveLinks.fb2) {
    formatButtons.push([{ text: '📝 FB2', callback_data: `format_${bookId}_fb2` }]);
  }

  formatButtons.push([{ text: '🔙 Назад к каталогу', callback_data: 'show_catalog' }]);

  const keyboard = {
    inline_keyboard: formatButtons
  };

  bot.sendMessage(chatId, bookText, {
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });
}

// ============================================
// ОФОРМЛЕНИЕ ЗАКАЗА И ОПЛАТА
// ============================================
function showPaymentInfo(chatId, bookId, format) {
  const book = books.find(b => b.id === bookId);
  const userId = chatId;

  // Создаем заказ
  orders[userId] = {
    bookId: bookId,
    bookTitle: book.title,
    format: format.toUpperCase(),
    price: book.price,
    status: 'awaiting_payment',
    timestamp: new Date()
  };

  const paymentText = `
✅ *Ваш заказ оформлен!*

📚 Книга: ${book.title}
📄 Формат: ${format.toUpperCase()}
💰 Цена: ${book.price} руб.

💳 *РЕКВИЗИТЫ ДЛЯ ОПЛАТЫ:*
Номер карты: \`2202 2063 4567 8901\`
Получатель: Иванов Иван Иванович

📝 *ИНСТРУКЦИЯ ПО ОПЛАТЕ:*
1. Переведите ${book.price} руб. на указанную карту
2. Сделайте скриншот чека об оплате
3. Отправьте чек (фото) в этот чат
4. Дождитесь подтверждения администратора
5. Получите ссылку на скачивание книги!

⏰ Проверка оплаты обычно занимает 10-30 минут.

_Просто отправьте фото чека следующим сообщением._
  `;

  const keyboard = {
    inline_keyboard: [
      [{ text: '❌ Отменить заказ', callback_data: 'cancel_order' }],
      [{ text: '🔙 К каталогу', callback_data: 'show_catalog' }]
    ]
  };

  bot.sendMessage(chatId, paymentText, {
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });
}

// ============================================
// ОБРАБОТКА ФОТО (ЧЕК)
// ============================================
bot.on('photo', (msg) => {
  const chatId = msg.chat.id;
  const userId = chatId;
  const userName = msg.from.first_name;
  const userUsername = msg.from.username || 'без username';

  // Проверяем, есть ли активный заказ
  if (!orders[userId] || orders[userId].status !== 'awaiting_payment') {
    bot.sendMessage(chatId, '❌ У вас нет активного заказа. Сначала выберите книгу из каталога.');
    return;
  }

  const order = orders[userId];
  const photo = msg.photo[msg.photo.length - 1]; // Берем фото лучшего качества
  
  // Обновляем статус заказа
  order.status = 'pending_confirmation';
  order.receiptPhotoId = photo.file_id;

  // Уведомление пользователю
  bot.sendMessage(chatId, `
✅ *Спасибо! Чек получен.*

🔍 Ваш заказ отправлен администратору на проверку.
⏰ Обычно это занимает 10-30 минут.

Мы уведомим вас, как только оплата будет подтверждена! 🎉
  `, { parse_mode: 'Markdown' });

  // Уведомление администратору
  const adminText = `
🔔 *НОВЫЙ ЗАКАЗ!*

👤 Пользователь: ${userName} (@${userUsername})
🆔 User ID: \`${userId}\`

📚 Книга: *${order.bookTitle}*
📄 Формат: ${order.format}
💰 Сумма: ${order.price} руб.

📸 Чек получен ⬇️
  `;

  bot.sendMessage(ADMIN_ID, adminText, { parse_mode: 'Markdown' });
  bot.sendPhoto(ADMIN_ID, photo.file_id);

  // Кнопки для админа
  const adminKeyboard = {
    inline_keyboard: [
      [{ text: '✅ Подтвердить оплату', callback_data: `confirm_${userId}` }],
      [{ text: '❌ Отклонить', callback_data: `reject_${userId}` }]
    ]
  };

  bot.sendMessage(ADMIN_ID, 'Выберите действие:', { reply_markup: adminKeyboard });
});

// ============================================
// ФУНКЦИЯ ПОЛУЧЕНИЯ ПРЯМОЙ ССЫЛКИ НА СКАЧИВАНИЕ
// ============================================
function getDirectDownloadLink(driveUrl) {
  // Извлекаем ID файла из ссылки Google Drive
  const fileIdMatch = driveUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (fileIdMatch && fileIdMatch[1]) {
    const fileId = fileIdMatch[1];
    // Формируем прямую ссылку на скачивание
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }
  return driveUrl; // Возвращаем оригинальную ссылку, если не удалось преобразовать
}

// ============================================
// ПОДТВЕРЖДЕНИЕ АДМИНОМ
// ============================================
function confirmOrder(adminChatId, userId) {
  const order = orders[userId];

  if (!order) {
    bot.sendMessage(adminChatId, '❌ Заказ не найден');
    return;
  }

  const book = books.find(b => b.id === order.bookId);
  const formatLower = order.format.toLowerCase();
  const driveLink = book.driveLinks[formatLower];

  if (!driveLink) {
    bot.sendMessage(adminChatId, `❌ Ссылка на файл в формате ${order.format} не найдена`);
    return;
  }

  // Обновляем статус
  order.status = 'confirmed';

  // Уведомление админу
  bot.sendMessage(adminChatId, `✅ Заказ подтвержден. Ссылка отправлена пользователю.`);

  // Получаем прямую ссылку на скачивание
  const downloadLink = getDirectDownloadLink(driveLink);

  // Уведомление пользователю
  bot.sendMessage(userId, `
🎉 *Отлично! Ваша оплата подтверждена!*

📚 Ваша книга "${order.bookTitle}" в формате ${order.format} готова к скачиванию.

🔗 *Ссылка на скачивание:*
${downloadLink}

📥 *Как скачать:*
1. Нажмите на ссылку выше
2. Если появится предупреждение Google Drive, нажмите "Всё равно скачать"
3. Файл загрузится на ваше устройство

Спасибо за покупку! 🙏
Если возникнут вопросы, обращайтесь к администратору.
Приятного чтения! 📖✨
  `, { parse_mode: 'Markdown' });

  // Удаляем заказ из памяти
  delete orders[userId];
}

// ============================================
// ОТКЛОНЕНИЕ ЗАКАЗА
// ============================================
function rejectOrder(adminChatId, userId) {
  const order = orders[userId];

  if (!order) {
    bot.sendMessage(adminChatId, '❌ Заказ не найден');
    return;
  }

  order.status = 'rejected';

  bot.sendMessage(adminChatId, '❌ Заказ отклонен. Пользователь уведомлен.');

  bot.sendMessage(userId, `
❌ *К сожалению, оплата не подтверждена.*

Возможные причины:
• Неверная сумма перевода
• Чек нечитаемый или неполный
• Оплата на другую карту

📞 Пожалуйста, свяжитесь с администратором для уточнения деталей.
  `, { parse_mode: 'Markdown' });

  delete orders[userId];
}

// ============================================
// ОТМЕНА ЗАКАЗА ПОЛЬЗОВАТЕЛЕМ
// ============================================
function cancelOrder(chatId) {
  if (orders[chatId]) {
    delete orders[chatId];
  }

  bot.sendMessage(chatId, `
❌ *Заказ отменен.*

Вы можете вернуться к каталогу в любое время!
  `, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '📖 Вернуться к каталогу', callback_data: 'show_catalog' }]
      ]
    }
  });
}

// ============================================
// ОБРАБОТКА CALLBACK КНОПОК
// ============================================
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  // Показать каталог
  if (data === 'show_catalog') {
    showCatalog(chatId);
  }
  
  // Выбор книги
  else if (data.startsWith('book_')) {
    const bookId = parseInt(data.split('_')[1]);
    showBookDetails(chatId, bookId);
  }
  
  // Выбор формата
  else if (data.startsWith('format_')) {
    const parts = data.split('_');
    const bookId = parseInt(parts[1]);
    const format = parts[2];
    showPaymentInfo(chatId, bookId, format);
  }
  
  // Отмена заказа
  else if (data === 'cancel_order') {
    cancelOrder(chatId);
  }
  
  // Подтверждение админом
  else if (data.startsWith('confirm_')) {
    const userId = data.split('_')[1];
    confirmOrder(chatId, userId);
  }
  
  // Отклонение админом
  else if (data.startsWith('reject_')) {
    const userId = data.split('_')[1];
    rejectOrder(chatId, userId);
  }

  // Убираем "часики" с кнопки
  bot.answerCallbackQuery(query.id);
});

// ============================================
// ЗАПУСК БОТА
// ============================================
console.log('🤖 Бот запущен!');
console.log('📚 Книжная витрина готова к работе');

// Обработка ошибок
bot.on('polling_error', (error) => {
  console.log('Ошибка polling:', error);
});