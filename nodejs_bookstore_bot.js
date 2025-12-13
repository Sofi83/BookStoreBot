// ============================================
// УСТАНОВКА: npm install node-telegram-bot-api
// ============================================

const TelegramBot = require('node-telegram-bot-api');

// Замените YOUR_BOT_TOKEN на токен от @BotFather
const token = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN';
const bot = new TelegramBot(token, { polling: true });

// ID администратора (получите через @userinfobot)
const ADMIN_ID = process.env.ADMIN_ID || 'YOUR_ADMIN_TELEGRAM_ID';

// Реквизиты для оплаты (из переменных окружения)
const CARD_NUMBER = process.env.CARD_NUMBER || '2200 7019 3298 7578';

// Хранилище заказов (в реальном проекте используйте базу данных)
const orders = {};

// ============================================
// ФУНКЦИИ ПОЛУЧЕНИЯ ПРЯМЫХ ССЫЛОК
// ============================================
// Для изображений (просмотр) - Dropbox
function getDirectViewLink(dropboxUrl) {
  // Для Dropbox: для просмотра изображений используем оригинальную ссылку
  // или заменяем dl=1 на dl=0, если нужно просмотр вместо скачивания
  if (dropboxUrl.includes('dropbox.com')) {
    // Если есть dl=1, заменяем на dl=0 для просмотра
    if (dropboxUrl.includes('&dl=1') || dropboxUrl.includes('?dl=1')) {
      return dropboxUrl.replace(/[?&]dl=1/, '?dl=0').replace(/&dl=0/, '?dl=0');
    }
    // Если dl параметр отсутствует, добавляем dl=0 для просмотра
    if (!dropboxUrl.includes('dl=')) {
      return dropboxUrl + (dropboxUrl.includes('?') ? '&' : '?') + 'dl=0';
    }
  }
  return dropboxUrl; // Возвращаем оригинальную ссылку
}

// Для файлов (скачивание) - Dropbox
function getDirectDownloadLink(dropboxUrl) {
  // Для Dropbox: заменяем dl=0 на dl=1 для прямого скачивания
  if (dropboxUrl.includes('dropbox.com')) {
    // Простая и надежная замена: заменяем все вхождения dl=0 на dl=1
    if (dropboxUrl.includes('dl=0')) {
      return dropboxUrl.replace(/dl=0/g, 'dl=1');
    }
    // Если dl параметр отсутствует, добавляем dl=1 для скачивания
    if (!dropboxUrl.includes('dl=')) {
      return dropboxUrl + (dropboxUrl.includes('?') ? '&' : '?') + 'dl=1';
    }
    // Если уже есть dl=1, возвращаем как есть
    return dropboxUrl;
  }
  
  // Если это не Dropbox ссылка, возвращаем оригинальную
  console.warn('Ссылка не является Dropbox ссылкой:', dropboxUrl);
  return dropboxUrl;
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
    imageUrl: 'https://www.dropbox.com/scl/fi/ubsryaye44o668euqqlzu/_-_.png?rlkey=v8qhg30nc4w0koss89vynnsbr&st=kcmtndpw&dl=0',
    description: `История, которая перевернёт ваше представление о реальности
Представьте: женщина в современном мире вдруг начинает видеть то, что не укладывается в логику.
 Воспоминания — слишком ясные, слишком живые. И постепенно она понимает: это не фантазии. Это память другой жизни. Она — Диана. Но когда-то она была Дидоной — царицей Карфагена.`,
    driveLinks: {
      pdf: 'https://www.dropbox.com/scl/fi/lac57xtrxhhi8cqv89gg8/_-_-_.pdf?rlkey=bv8d4fjqj30pu2y1awz917wfd&st=13eg0fc5&dl=0',
      audio: 'https://www.dropbox.com/scl/fi/7wcmciwhfeft9ej5guy63/_-_-_-_.mp3?rlkey=ihpu2hg4xpf3526sgrnhf13tu&st=4cvr3v1s&dl=0'
    }
  },
  {
    id: 2,
    title: 'Где живет твой Демон?!',
    author: 'Автор',
    price: 500,
    available: true,
    imageUrl: 'https://www.dropbox.com/scl/fi/vv7jpooquq4h67hrtlgal/_-_-_-_.png?rlkey=ygoxlmc7qzzbscux02uzylro7&st=q4v6kje7&dl=0',
    description: `Победишь себя – победишь мир. 
Книга о внутренней силе и той стороне личности, которая влияет на всё.`,
    driveLinks: {
      pdf: 'https://www.dropbox.com/scl/fi/qy7j0bzpocbbgqphaeopp/_-_-_-_-_.pdf?rlkey=syvxxht6d0hgb12jk4bvgepfb&st=jhs5ql3e&dl=0'
    }
  },
  {
    id: 3,
    title: 'Книга современной ведьМы',
    author: 'Автор',
    price: 500,
    available: true,
    imageUrl: 'https://www.dropbox.com/scl/fi/18ylo768tk7huud7ctn3o/_-_-_.png?rlkey=x8xsgkhuftbwq776et4d4ajl4&st=vkfkzg5u&dl=0',
    description: `Существуют ли сейчас ведьмы? 

Каждая женщина — ведьма. Простые практики и медитации, которые меняют внутренний мир.`,
    driveLinks: {
      pdf: 'https://www.dropbox.com/scl/fi/nen9vpo66hd7955j2z1gm/_-_-_-_.pdf?rlkey=h3xq4cm2j3yx4cudi1giiwj69&st=23kr7qjo&dl=0'
    }
  },
  {
    id: 4,
    title: 'Легенда Карфагена',
    author: 'Автор',
    price: 500,
    available: false, // Скоро выход
    imageUrl: 'https://www.dropbox.com/scl/fi/4hjviyn8czzxogbtul6ze/_-_.png?rlkey=10teqo97m2s0gpl35s08u5ah4&st=n9ih1px0&dl=0',
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
  const welcomeImageUrl = 'https://www.dropbox.com/scl/fi/id2e56iwj5qzw8zepy343/.jpeg?rlkey=oxy1xhptj63p3sq3soui2hw6l&st=hqx2mvzr&dl=0';
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
    
    if (!book.available) {
      catalogText += `⏳ _Скоро в продаже_\n`;
    } else {
      catalogText += `👛 Цена: ${book.price} руб.\n`;
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
  try {
    const book = books.find(b => b.id === bookId);
    
    if (!book) {
      console.error(`❌ Книга с ID ${bookId} не найдена`);
      bot.sendMessage(chatId, '❌ Книга не найдена. Пожалуйста, выберите книгу из каталога.');
      return;
    }

    const userId = chatId;
    
    console.log(`📝 Создание заказа: userId=${userId}, bookId=${bookId}, format=${format}`);

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
Номер карты:
\`\`\`
${CARD_NUMBER}
\`\`\`

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
    }).then(() => {
      console.log(`✅ Сообщение с реквизитами отправлено пользователю ${chatId} для формата ${format}`);
    }).catch((error) => {
      console.error(`❌ Ошибка при отправке сообщения с реквизитами:`, error);
      // Пробуем отправить без Markdown
      const plainText = paymentText.replace(/\*/g, '').replace(/_/g, '');
      bot.sendMessage(chatId, plainText, { reply_markup: keyboard })
        .catch((retryError) => {
          console.error(`❌ Критическая ошибка при отправке сообщения:`, retryError);
          bot.sendMessage(chatId, '❌ Произошла ошибка. Пожалуйста, попробуйте еще раз или обратитесь к администратору.');
        });
    });
  } catch (error) {
    console.error(`❌ Ошибка в функции showPaymentInfo:`, error);
    bot.sendMessage(chatId, '❌ Произошла ошибка при оформлении заказа. Пожалуйста, попробуйте еще раз.');
  }
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
  console.log(`🔗 Сформирована ссылка на скачивание: ${downloadLink}`);
  console.log(`📄 Исходная ссылка: ${driveLink}`);
  console.log(`📋 Проверка ссылки: ${downloadLink.includes('dl=1') ? '✅ Правильно (dl=1 для скачивания)' : '⚠️ Возможно неправильно'}`);

  // Ссылка на изображение
  const imageUrl = 'https://www.dropbox.com/scl/fi/p4wdc2ckl5kgy74nz8xt6/_-_.png?rlkey=zj9gqf9t8u8sp5d3xfmfg98qa&st=gvut8sj5&dl=0';
  const imageLink = getDirectViewLink(imageUrl);
  console.log(`🖼️ Исходная ссылка на изображение: ${imageUrl}`);
  console.log(`🖼️ Прямая ссылка на изображение: ${imageLink}`);

  // Текст уведомления
  const notificationText = `
🎉 *Отлично! Ваша оплата подтверждена!*

📚 Ваша книга "${order.bookTitle}" в формате ${order.format} готова к скачиванию.

🔗 *Ссылка на скачивание:*
[Скачать книгу](${downloadLink})

_Или скопируйте ссылку напрямую:_
\`${downloadLink}\`

📥 *Как скачать:*
1. Нажмите на ссылку выше
2. Если появится предупреждение DropBox, нажмите "Всё равно скачать"
3. *После скачивания книга появится в вашем приложении для просмотра файлов*

С наступающим Новым годом! 🎄💚
Пусть он будет добрым, спокойным и щедрым на чудеса. ✨🎁

Спасибо за покупку! 🙏
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
      console.log(`📎 Ссылка на скачивание в сообщении: ${downloadLink}`);
      
      // Уведомление админу о успешной отправке с упоминанием
      const adminNotification = `✅ *Заказ подтвержден!*\n\n📤 Сообщение отправлено пользователю [ID: ${userId}](tg://user?id=${userId})\n\n📚 Книга: *${order.bookTitle}*\n📄 Формат: ${order.format}\n🔗 Ссылка на файл: ${downloadLink}`;
      bot.sendMessage(adminChatId, adminNotification, { parse_mode: 'Markdown' })
        .catch((adminError) => {
          console.error('⚠️ Ошибка при отправке уведомления админу:', adminError);
          // Пробуем без форматирования
          bot.sendMessage(adminChatId, `✅ Заказ подтвержден. Сообщение отправлено пользователю ${userId}. Книга: ${order.bookTitle}, Формат: ${order.format}`);
        });
      
      // Удаляем заказ из памяти только после успешной отправки
      delete orders[userId];
      
      // Отправляем изображение из Dropbox
      console.log(`🖼️ Попытка отправить изображение пользователю ${userId} по ссылке: ${imageLink}`);
      
      bot.sendPhoto(userId, imageLink)
        .then(() => {
          console.log(`✅ Изображение отправлено пользователю ${userId}`);
        })
        .catch((photoError) => {
          console.error('⚠️ Ошибка при отправке изображения через sendPhoto:', photoError.message);
          
          // Пробуем отправить как документ
          bot.sendDocument(userId, imageLink)
            .then(() => {
              console.log(`✅ Изображение отправлено как документ пользователю ${userId}`);
            })
            .catch((docError) => {
              console.error('⚠️ Ошибка при отправке как документ:', docError.message);
              // В последнюю очередь отправляем ссылку текстом
              bot.sendMessage(userId, `🖼️ *Изображение:*\n\n[📷 Смотреть изображение](${imageLink})`, { parse_mode: 'Markdown' })
                .then(() => {
                  console.log(`✅ Ссылка на изображение отправлена пользователю ${userId}`);
                })
                .catch((linkError) => {
                  console.error('⚠️ Не удалось отправить ссылку на изображение:', linkError.message);
                });
            });
        });
    })
    .catch((error) => {
      console.error('❌ Ошибка при отправке сообщения с Markdown:', error);
      console.error('Детали ошибки:', JSON.stringify(error, null, 2));
      console.error(`📤 Попытка отправки пользователю ${userId} (тип: ${typeof userId})`);
      console.error(`🔗 Ссылка на скачивание: ${downloadLink}`);
      
      // Пробуем отправить без Markdown форматирования
      const plainText = notificationText.replace(/\*/g, '').replace(/_/g, '').replace(/`/g, '');
      bot.sendMessage(userId, plainText)
        .then(() => {
          console.log(`✅ Уведомление отправлено пользователю ${userId} (без Markdown)`);
          const adminMsg = `✅ Заказ подтвержден. Сообщение отправлено пользователю [ID: ${userId}](tg://user?id=${userId}) (без форматирования).\n\n🔗 Ссылка: ${downloadLink}`;
          bot.sendMessage(adminChatId, adminMsg, { parse_mode: 'Markdown' })
            .catch(() => {
              bot.sendMessage(adminChatId, `✅ Заказ подтвержден. Сообщение отправлено пользователю ${userId} (без форматирования).\nСсылка: ${downloadLink}`);
            });
          delete orders[userId];
        })
        .catch((retryError) => {
          console.error('❌ Критическая ошибка при повторной отправке сообщения:', retryError);
          console.error('Детали ошибки:', JSON.stringify(retryError, null, 2));
          // Уведомление админу об ошибке с подробностями
          const errorMsg = `❌ *КРИТИЧЕСКАЯ ОШИБКА*\n\nНе удалось отправить файл пользователю [ID: ${userId}](tg://user?id=${userId})\n\n📚 Книга: *${order.bookTitle}*\n📄 Формат: ${order.format}\n🔗 Ссылка: ${downloadLink}\n\n❌ Ошибка: ${retryError.message || retryError}`;
          bot.sendMessage(adminChatId, errorMsg, { parse_mode: 'Markdown' })
            .catch(() => {
              bot.sendMessage(adminChatId, `❌ Ошибка при отправке сообщения пользователю ${userId}: ${retryError.message || retryError}\nСсылка: ${downloadLink}`);
            });
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
    console.log(`📥 Выбран формат: bookId=${bookId}, format=${format}, callback_data=${data}`);
    
    if (isNaN(bookId)) {
      console.error(`❌ Неверный bookId: ${parts[1]}`);
      bot.sendMessage(chatId, '❌ Ошибка: неверный ID книги. Пожалуйста, выберите книгу из каталога.');
      return;
    }
    
    if (!format) {
      console.error(`❌ Формат не указан в callback_data: ${data}`);
      bot.sendMessage(chatId, '❌ Ошибка: формат не указан. Пожалуйста, выберите формат еще раз.');
      return;
    }
    
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