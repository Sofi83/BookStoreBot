// ============================================
// УСТАНОВКА: npm install node-telegram-bot-api
// ============================================

const TelegramBot = require('node-telegram-bot-api');

// Замените YOUR_BOT_TOKEN на токен от @BotFather
const token = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN';
const bot = new TelegramBot(token, { polling: true });

// ID администратора (получите через @userinfobot)
const ADMIN_ID = process.env.ADMIN_ID || 'YOUR_ADMIN_TELEGRAM_ID';

// Хранилище заказов (в реальном проекте используйте базу данных)
const orders = {};

// ============================================
// ФУНКЦИИ ПОЛУЧЕНИЯ ПРЯМЫХ ССЫЛОК
// ============================================
// Для изображений (просмотр)
function getDirectViewLink(driveUrl) {
  // Извлекаем ID файла из ссылки Google Drive
  const fileIdMatch = driveUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (fileIdMatch && fileIdMatch[1]) {
    const fileId = fileIdMatch[1];
    // Для изображений используем формат просмотра
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }
  return driveUrl; // Возвращаем оригинальную ссылку, если не удалось преобразовать
}

// Для файлов (скачивание)
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
// КАТАЛОГ КНИГ
// ============================================
const books = [
  {
    id: 1,
    title: 'Я ведьма. Жизнь До и После...',
    author: 'Автор',
    price: 500,
    available: true,
    imageUrl: 'https://drive.google.com/file/d/1qb56gm96i3s52XAtUwoCaicNBotx0OJu/view?usp=sharing',
    description: `История, которая перевернёт ваше представление о реальности
Представьте: женщина в современном мире вдруг начинает видеть то, что не укладывается в логику.
 Воспоминания — слишком ясные, слишком живые. И постепенно она понимает: это не фантазии. Это память другой жизни. Она — Диана. Но когда-то она была Дидоной — царицей Карфагена.`,
    driveLinks: {
      pdf: 'https://drive.google.com/file/d/1C2aCMZifPJMErlbTZ5BTqJomjj-w30lA/view?usp=share_link',
      epub: 'https://drive.google.com/file/d/1vUj_MsZqrZjVS67n1pVOSbZ4w0dBdGrT/view?usp=share_link',
      audio: 'https://drive.google.com/file/d/1j3wNtQ9WmO-Cp00qPjO6kzV_h9yT3Kep/view?usp=sharing'
    }
  },
  {
    id: 2,
    title: 'Где живет твой Демон?!',
    author: 'Автор',
    price: 500,
    available: true,
    imageUrl: 'https://drive.google.com/file/d/1aY7kAq_k_mCfF5Ao6cjN15U9dXVhBXZA/view?usp=sharing',
    description: `Победишь себя – победишь мир. 
Книга о внутренней силе и той стороне личности, которая влияет на всё.`,
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
    imageUrl: 'https://drive.google.com/file/d/1NoumRji3fPidQyj9lIwZMLH8wX8kPNRN/view?usp=sharing',
    description: `Существуют ли сейчас ведьмы? 

Каждая женщина — ведьма. Простые практики и медитации, которые меняют внутренний мир.`,
    driveLinks: {
      pdf: 'https://drive.google.com/file/d/1wTGjTeOQyV_NS76kVjUq9LZ848PBEDjC/view?usp=share_link'
    }
  },
  {
    id: 4,
    title: 'Легенда Карфагена',
    author: 'Автор',
    price: 500,
    available: false, // Скоро выход
    imageUrl: 'https://drive.google.com/file/d/1Q4L_-Lt1FZ2AZR8-at2zxa-2AZHZRqYQ/view?usp=sharing',
    description: `Пророчества Дидоны, рождение Ганнибала Барки, великая любовь и судьба Карфагена.
Скоро в продаже`,
    driveLinks: {}
  }
];

// ============================================
// КОМАНДА /start - ПРИВЕТСТВИЕ
// ============================================
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.first_name;

  const welcomeText = `Добро пожаловать в мир книг Виктории Байн 📚✨

Здесь каждая история открывается тем, кто готов услышать 🖤

Переходите в каталог и выбирайте книгу 👇🏻`;

  // Ссылка на приветственную картинку
  const welcomeImageUrl = 'https://drive.google.com/file/d/1fFXVO4d7nWAQfKMFy6YxOBk4HxuQCXFA/view?usp=share_link';
  const welcomeImageLink = getDirectViewLink(welcomeImageUrl);

  const keyboard = {
    inline_keyboard: [
      [{ text: '📖 Витрина книг', callback_data: 'show_catalog' }]
    ]
  };

  // Отправляем фото с текстом (с обработкой ошибок)
  bot.sendPhoto(chatId, welcomeImageLink, {
    caption: welcomeText,
    reply_markup: keyboard
  }).catch((error) => {
    console.error('Ошибка при отправке фото:', error);
    // Если не удалось отправить фото, отправляем только текст
    bot.sendMessage(chatId, welcomeText, { reply_markup: keyboard });
  });
});

// ============================================
// ПОКАЗАТЬ КАТАЛОГ
// ============================================
function showCatalog(chatId) {
  let catalogText = '📚 *Витрина книг:*\n\n';

  books.forEach(book => {
    catalogText += `*📖 "${book.title}"*\n`;
    catalogText += `👛 Цена: ${book.price} руб.\n`;
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

  // Формируем текст с описанием
  let bookText = `📚 *${book.title}*\n👛 Цена: ${book.price} руб.\n`;
  
  // Добавляем описание, если оно есть
  if (book.description && book.description.trim() !== '') {
    bookText += `\n${book.description}\n`;
  }
  
  bookText += `\nВыберите формат книги:`;

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
  if (book.driveLinks.audio) {
    formatButtons.push([{ text: '🎧 Аудио', callback_data: `format_${bookId}_audio` }]);
  }

  formatButtons.push([{ text: '🔙 Назад к каталогу', callback_data: 'show_catalog' }]);

  const keyboard = {
    inline_keyboard: formatButtons
  };

  // Если есть изображение, отправляем фото с текстом
  if (book.imageUrl && book.imageUrl.trim() !== '') {
    const bookImageLink = getDirectViewLink(book.imageUrl);
    bot.sendPhoto(chatId, bookImageLink, {
      caption: bookText,
      parse_mode: 'Markdown',
      reply_markup: keyboard
    }).catch((error) => {
      console.error('Ошибка при отправке фото книги:', error);
      // Если не удалось отправить фото, отправляем только текст
      bot.sendMessage(chatId, bookText, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    });
  } else {
    // Если нет изображения, отправляем только текст
    bot.sendMessage(chatId, bookText, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }
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
👛 Цена: ${book.price} руб.

💳 *РЕКВИЗИТЫ ДЛЯ ОПЛАТЫ:*
Номер карты: \`2200 7019 3298 7578\`

📝 *ИНСТРУКЦИЯ ПО ОПЛАТЕ:*
1. Переведите ${book.price} руб. на указанную карту
2. Сделайте скриншот чека об оплате
3. Отправьте чек (фото) в этот чат
4. Дождитесь подтверждение оплаты
5. Получите ссылку на скачивание книги!

⏰ Проверка оплаты обычно занимает до 10 минут.

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

⏰ Минуточку... Проверяем оплату.

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
// ПОДТВЕРЖДЕНИЕ АДМИНОМ
// ============================================
function confirmOrder(adminChatId, userId) {
  const order = orders[userId];

  if (!order) {
    bot.sendMessage(adminChatId, '❌ Заказ не найден');
    return;
  }

  const book = books.find(b => b.id === order.bookId);
  
  if (!book) {
    bot.sendMessage(adminChatId, `❌ Книга с ID ${order.bookId} не найдена`);
    return;
  }

  const formatLower = order.format.toLowerCase();
  
  // Получаем ссылку на файл
  let driveLink = book.driveLinks[formatLower];
  
  // Для аудио проверяем и audio, и mp3
  if (!driveLink && formatLower === 'audio') {
    driveLink = book.driveLinks.mp3 || book.driveLinks.audio;
  }

  if (!driveLink) {
    console.error(`❌ Ссылка на файл не найдена. Книга: ${book.title}, Формат: ${order.format}, Доступные форматы:`, Object.keys(book.driveLinks));
    bot.sendMessage(adminChatId, `❌ Ссылка на файл в формате ${order.format} не найдена для книги "${book.title}". Доступные форматы: ${Object.keys(book.driveLinks).join(', ')}`);
    return;
  }

  // Обновляем статус
  order.status = 'confirmed';

  // Получаем прямую ссылку на скачивание
  const downloadLink = getDirectDownloadLink(driveLink);

  // Ссылка на видео
  const videoUrl = 'https://drive.google.com/file/d/1t-11J0whrVTMCDt7mi7Yld1lV7mYJWWG/view?usp=share_link';
  const videoLink = getDirectDownloadLink(videoUrl);

  // Текст уведомления
  const notificationText = `
🎉 *Отлично! Ваша оплата подтверждена!*

📚 Ваша книга "${order.bookTitle}" в формате ${order.format} готова к скачиванию.

🔗 *Ссылка на скачивание:*
[📥 Скачать книгу](${downloadLink})

📥 *Как скачать:*
1. Нажмите на ссылку выше
2. Если появится предупреждение Google Drive, нажмите "Всё равно скачать"
3. Файл загрузится на ваше устройство

Спасибо за покупку! 🙏

С наступающим Новым годом! 🎄💚
Пусть он будет добрым, спокойным и щедрым на чудеса. ✨🎁

Если ссылка не открывается -  напишите, я отправлю её ещё раз.
Приятного чтения! 📖✨
  `;

  // Логируем информацию для отладки
  console.log(`📤 Отправка уведомления пользователю ${userId} (тип: ${typeof userId})`);
  console.log(`📚 Книга: ${order.bookTitle}, Формат: ${order.format}`);
  console.log(`🔗 Ссылка на скачивание: ${downloadLink}`);

  // Проверяем, что userId валидный
  if (!userId || (typeof userId !== 'number' && typeof userId !== 'string')) {
    console.error(`❌ Неверный userId: ${userId} (тип: ${typeof userId})`);
    bot.sendMessage(adminChatId, `❌ Ошибка: неверный ID пользователя для отправки сообщения`);
    return;
  }

  // Сначала отправляем текстовое сообщение пользователю
  bot.sendMessage(userId, notificationText, { parse_mode: 'Markdown' })
    .then(() => {
      console.log(`✅ Уведомление отправлено пользователю ${userId}`);
      // Уведомление админу о успешной отправке
      bot.sendMessage(adminChatId, `✅ Заказ подтвержден. Сообщение отправлено пользователю ${userId}.`);
      
      // Удаляем заказ из памяти только после успешной отправки
      delete orders[userId];
      
      // Затем пытаемся отправить видео отдельно (не критично, если не получится)
      bot.sendVideo(userId, videoLink)
        .then(() => {
          console.log(`✅ Видео отправлено пользователю ${userId}`);
        })
        .catch((error) => {
          console.error('⚠️ Не удалось отправить видео (это не критично):', error);
          // Видео не критично, основное сообщение уже отправлено
        });
    })
    .catch((error) => {
      console.error('❌ Ошибка при отправке сообщения с Markdown:', error);
      // Пробуем отправить без Markdown форматирования
      const plainText = notificationText.replace(/\*/g, '').replace(/_/g, '');
      bot.sendMessage(userId, plainText)
        .then(() => {
          console.log(`✅ Уведомление отправлено пользователю ${userId} (без Markdown)`);
          bot.sendMessage(adminChatId, `✅ Заказ подтвержден. Сообщение отправлено пользователю ${userId} (без форматирования).`);
          delete orders[userId];
        })
        .catch((retryError) => {
          console.error('❌ Ошибка при повторной отправке сообщения:', retryError);
          console.error('Детали ошибки:', JSON.stringify(retryError, null, 2));
          // Уведомление админу об ошибке
          bot.sendMessage(adminChatId, `❌ Ошибка при отправке сообщения пользователю ${userId}: ${retryError.message || retryError}`);
          // Не удаляем заказ при ошибке, чтобы можно было попробовать снова
        });
    });
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
    // Преобразуем userId в число для поиска в orders (так как там ключи - числа)
    const userIdNum = parseInt(userId, 10);
    if (isNaN(userIdNum)) {
      bot.sendMessage(chatId, '❌ Ошибка: неверный ID пользователя');
      return;
    }
    confirmOrder(chatId, userIdNum);
  }
  
  // Отклонение админом
  else if (data.startsWith('reject_')) {
    const userId = data.split('_')[1];
    // Преобразуем userId в число для поиска в orders (так как там ключи - числа)
    const userIdNum = parseInt(userId, 10);
    if (isNaN(userIdNum)) {
      bot.sendMessage(chatId, '❌ Ошибка: неверный ID пользователя');
      return;
    }
    rejectOrder(chatId, userIdNum);
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