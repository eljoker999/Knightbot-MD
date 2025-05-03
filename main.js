const settings = require('./settings');
require('./config.js');
const { isBanned } = require('./lib/isBanned');
const yts = require('yt-search');
const { fetchBuffer } = require('./lib/myfunc');
const fs = require('fs');
const fetch = require('node-fetch');
const ytdl = require('ytdl-core');
const path = require('path');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');

// Command imports
const tagAllCommand = require('./commands/منشن');
const helpCommand = require('./commands/help');
const banCommand = require('./commands/حظر');
const { promoteCommand } = require('./commands/رفع-رتبة');
const { demoteCommand } = require('./commands/خفض-رتبة');
const muteCommand = require('./commands/كتم');
const unmuteCommand = require('./commands/فك-كتم');
const stickerCommand = require('./commands/sticker');
const isAdmin = require('./lib/isAdmin');
const warnCommand = require('./commands/انذار');
const warningsCommand = require('./commands/انذارات');
const ttsCommand = require('./commands/انطق');
const { tictactoeCommand, handleTicTacToeMove } = require('./commands/لعبة-xo');
const { incrementMessageCount, topMembers } = require('./commands/اعلى-الاعضاء');
const ownerCommand = require('./commands/المالك');
const deleteCommand = require('./commands/حذف');
const { handleAntilinkCommand, handleLinkDetection } = require('./commands/antilink');
const { Antilink } = require('./lib/antilink');
const memeCommand = require('./commands/meme');
const tagCommand = require('./commands/tag');
const jokeCommand = require('./commands/joke');
const quoteCommand = require('./commands/حكمة');
const factCommand = require('./commands/حقيقة');
const weatherCommand = require('./commands/طقس');
const newsCommand = require('./commands/اخبار');
const kickCommand = require('./commands/طرد');
const simageCommand = require('./commands/simage');
const attpCommand = require('./commands/ملصق');
const { startHangman, guessLetter } = require('./commands/لعبة-الشنق');
const { complimentCommand } = require('./commands/مجاملة');
const { insultCommand } = require('./commands/اهانة');
const { eightBallCommand } = require('./commands/حظي');
const { lyricsCommand } = require('./commands/كلمات');
const { dareCommand } = require('./commands/تحدي');
const { clearCommand } = require('./commands/مسح');
const pingCommand = require('./commands/حالة-البوت');
const aliveCommand = require('./commands/اختبار-البوت');
const blurCommand = require('./commands/صورة-تموية');
const welcomeCommand = require('./commands/ترحيب');
const goodbyeCommand = require('./commands/وداع');
const githubCommand = require('./commands/github');
const { handleAntiBadwordCommand, handleBadwordDetection } = require('./lib/antibadword');
const antibadwordCommand = require('./commands/منع-شتايم');
const { handleChatbotCommand, handleChatbotResponse } = require('./commands/chatbot');
const takeCommand = require('./commands/take');
const { flirtCommand } = require('./commands/مغازلة');
const characterCommand = require('./commands/شخصية');
const wastedCommand = require('./commands/ويستد');
const shipCommand = require('./commands/توافق');
const groupInfoCommand = require('./commands/جروبي');
const resetlinkCommand = require('./commands/resetlink');
const staffCommand = require('./commands/آدمن');
const unbanCommand = require('./commands/فك-حظر');
const emojimixCommand = require('./commands/دمج-ايمو');
const { handlePromotionEvent } = require('./commands/رفع-رتبة');
const { handleDemotionEvent } = require('./commands/خفض-رتبة');
const viewOnceCommand = require('./commands/viewonce');
const clearSessionCommand = require('./commands/حذف-السيشن');
const { autoStatusCommand, handleStatusUpdate } = require('./commands/حالة-تلقائية');
const { simpCommand } = require('./commands/simp');
const { stupidCommand } = require('./commands/بطاقة-غباء');
const pairCommand = require('./commands/pair');
const stickerTelegramCommand = require('./commands/stickertelegram');
const textmakerCommand = require('./commands/مؤثرات-نص');

// Global settings
global.packname = settings.packname;
global.author = settings.author;
global.channelLink = "https://whatsapp.com/channel/0029Vb5DF3H59PwKojA8O701";
global.ytch = "ELJOKER";

// Add this near the top of main.js with other global configurations
const channelInfo = {
    contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363161513685998@newsletter',
            newsletterName: 'ELGOKER-BOT-AM',
            serverMessageId: -1
        }
    }
};

async function handleMessages(sock, messageUpdate, printLog) {
    try {
        const { messages, type } = messageUpdate;
        if (type !== 'notify') return;

        const message = messages[0];
        if (!message?.message) return;

        const chatId = message.key.remoteJid;
        const senderId = message.key.participant || message.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');
        
        let userMessage = message.message?.conversation?.trim().toLowerCase() ||
            message.message?.extendedTextMessage?.text?.trim().toLowerCase() || '';
        userMessage = userMessage.replace(/\.\s+/g, '.').trim();

        // Only log command usage
        if (userMessage.startsWith('.')) {
            console.log(`📝 Command used in ${isGroup ? 'group' : 'private'}: ${userMessage}`);
        }

        // Check if user is banned (skip ban check for unban command)
        if (isBanned(senderId) && !userMessage.startsWith('.فك-حظر')) {
            // Only respond occasionally to avoid spam
            if (Math.random() < 0.1) { 
                await sock.sendMessage(chatId, { 
                    text: '❌ You are banned from using the bot. Contact an admin to get unbanned.',
                    ...channelInfo
                });
            }
            return;
        }

        // First check if it's a game move
        if (/^[1-9]$/.test(userMessage) || userMessage.toLowerCase() === 'استسلام') {
            await handleTicTacToeMove(sock, chatId, senderId, userMessage);
            return;
        }

      /*  // Basic message response in private chat
        if (!isGroup && (userMessage === 'hi' || userMessage === 'hello' || userMessage === 'bot' || userMessage === 'hlo' || userMessage === 'hey' || userMessage === 'bro')) {
            await sock.sendMessage(chatId, {
                text: 'Hi, How can I help you?\nYou can use .menu for more info and commands.',
                ...channelInfo
            });
            return;
        } */

        if (!message.key.fromMe) incrementMessageCount(chatId, senderId);

        // Check for bad words FIRST, before ANY other processing
        if (isGroup && userMessage) {
            await handleBadwordDetection(sock, chatId, message, userMessage, senderId);
        }

        // Then check for command prefix
        if (!userMessage.startsWith('.')) {
            if (isGroup) {
                // Process non-command messages first
                await handleChatbotResponse(sock, chatId, message, userMessage, senderId);
                await Antilink(message, sock);
                await handleBadwordDetection(sock, chatId, message, userMessage, senderId);
            }
            return;
        }

        // List of admin commands
        const adminCommands = ['.كتم', '.فك-كتم', '.حظر', '.فك-حظر', '.رفع', '.خفض', '.طرد', '.منشن', '.antilink'];
        const isAdminCommand = adminCommands.some(cmd => userMessage.startsWith(cmd));

        let isSenderAdmin = false;
        let isBotAdmin = false;

        if (isGroup && isAdminCommand) {
            const adminStatus = await isAdmin(sock, chatId, senderId);
            isSenderAdmin = adminStatus.isSenderAdmin;
            isBotAdmin = adminStatus.isBotAdmin;

            if (!isBotAdmin) {
                await sock.sendMessage(chatId, { text: 'Please make the bot an admin to use admin commands.', ...channelInfo });
                return;
            }

            if (
                userMessage.startsWith('.كتم') ||
                userMessage === '.فك-كتم' ||
                userMessage.startsWith('.حظر') ||
                userMessage.startsWith('.فك-حظر') ||
                userMessage.startsWith('.رفع') ||
                userMessage.startsWith('.خفض')
            ) {
                if (!isSenderAdmin && !message.key.fromMe) {
                    await sock.sendMessage(chatId, { 
                        text: 'Sorry, only group admins can use this command.',
                        ...channelInfo
                    });
                    return;
                }
            }
        }

        // Add this near the start of your message handling logic, before processing commands
        try {
            const data = JSON.parse(fs.readFileSync('./data/messageCount.json'));
            const senderNumber = senderId.split('@')[0];
            // Allow owner to use bot even in private mode
            if (!data.isPublic && senderNumber !== settings.ownerNumber) {
                return; // Silently ignore messages from non-owners when in private mode
            }
        } catch (error) {
            console.error('Error checking access mode:', error);
            // Default to public mode if there's an error reading the file
        }

        // Command handlers
        switch (true) {
            case userMessage === '.لصورة': {
                const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                if (quotedMessage?.stickerMessage) {
                    await simageCommand(sock, quotedMessage, chatId);
                } else {
                    await sock.sendMessage(chatId, { text: 'Please reply to a sticker with the .لصورة command to convert it.', ...channelInfo });
                }
                break;
            }
            case userMessage.startsWith('.طرد'):
                const mentionedJidListKick = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await kickCommand(sock, chatId, senderId, mentionedJidListKick, message);
                break;
            case userMessage.startsWith('.كتم'):
                const muteDuration = parseInt(userMessage.split(' ')[1]);
                if (isNaN(muteDuration)) {
                    await sock.sendMessage(chatId, { text: 'Please provide a valid number of minutes.\neg to mute 10 minutes\n.mute 10', ...channelInfo });
                } else {
                    await muteCommand(sock, chatId, senderId, muteDuration);
                }
                break;
            case userMessage === '.فك-كتم':
                await unmuteCommand(sock, chatId, senderId);
                break;
            case userMessage.startsWith('.حظر'):
                await banCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.فك-حظر'):
                await unbanCommand(sock, chatId, message);
                break;
            case userMessage === '.اوامر' || userMessage === '.الاوامر' || userMessage === '.بوت' || userMessage === '.قائمة':
                await helpCommand(sock, chatId, global.channelLink);
                break;
            case userMessage === '.لملصق' || userMessage=== '.س':
                await stickerCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.انذارات'):
                const mentionedJidListWarnings = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await warningsCommand(sock, chatId, mentionedJidListWarnings);
                break;
            case userMessage.startsWith('.انذار'):
                const mentionedJidListWarn = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await warnCommand(sock, chatId, senderId, mentionedJidListWarn, message);
                break;
            case userMessage.startsWith('.انطق'):
                const text = userMessage.slice(4).trim();
                await ttsCommand(sock, chatId, text);
                break;
            case userMessage === '.حذف' || userMessage === '.مسح':
                await deleteCommand(sock, chatId, message, senderId);
                break;
            case userMessage.startsWith('.ملصق'):
                await attpCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.الوضع'):
                // Check if sender is the owner number from settings
                const senderNumber = senderId.split('@')[0];
                if (senderNumber !== settings.ownerNumber) {
                    await sock.sendMessage(chatId, { text: 'Only bot owner can use this command!', ...channelInfo });
                    return;
                }
                // Read current data first
                let data;
                try {
                    data = JSON.parse(fs.readFileSync('./data/messageCount.json'));
                } catch (error) {
                    console.error('Error reading access mode:', error);
                    await sock.sendMessage(chatId, { text: 'Failed to read bot mode status', ...channelInfo });
                    return;
                }

                const action = userMessage.split(' ')[1]?.toLowerCase();
                // If no argument provided, show current status
                if (!action) {
                    const currentMode = data.isPublic ? 'عام' : 'خاص';
                    await sock.sendMessage(chatId, { 
                        text: `Current bot الوضع: *${currentMode}*\n\nUsage: .mode public/private\n\nExample:\n.الوضع عام - Allow everyone to use bot\n.الوضع خاص - Restrict to owner only`,
                        ...channelInfo
                    });
                    return;
                }

                if (action !== 'عام' && action !== 'خاص') {
                    await sock.sendMessage(chatId, { 
                        text: 'Usage: .الوضع عام/خاص\n\nExample:\n.الوضع عام - Allow everyone to use bot\n.الوضع خاص - Restrict to owner only',
                        ...channelInfo
                    });
                    return;
                }
                try {
                    // Update access mode
                    data.isPublic = action === 'عام';
                    
                    // Save updated data
                    fs.writeFileSync('./data/messageCount.json', JSON.stringify(data, null, 2));
                    
                    await sock.sendMessage(chatId, { text: `Bot is now in *${action}* الوضع`, ...channelInfo });
                } catch (error) {
                    console.error('Error updating access mode:', error);
                    await sock.sendMessage(chatId, { text: 'Failed to update bot access mode', ...channelInfo });
                }
                break;
            case userMessage === '.المالك':
                await ownerCommand(sock, chatId);
                break;
            case userMessage === '.منشن':
                if (isSenderAdmin || message.key.fromMe) {
                    await tagAllCommand(sock, chatId, senderId);
                } else {
                    await sock.sendMessage(chatId, { text: 'Sorry, only group admins can use the .tagall command.', ...channelInfo });
                }
                break;
            case userMessage.startsWith('.مخفي'):
                const messageText = userMessage.slice(4).trim();
                const replyMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;
                await tagCommand(sock, chatId, senderId, messageText, replyMessage);
                break;
            case userMessage.startsWith('.antilink'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, { 
                        text: 'This command can only be used in groups.',
                        ...channelInfo 
                    });
                    return;
                }
                if (!isBotAdmin) {
                    await sock.sendMessage(chatId, { 
                        text: 'Please make the bot an admin first.',
                        ...channelInfo 
                    });
                    return;
                }
                await handleAntilinkCommand(sock, chatId, userMessage, senderId, isSenderAdmin);
                break;
            case userMessage === '.ميمز':
                await memeCommand(sock, chatId);
                break;
            case userMessage === '.نكتة':
                await jokeCommand(sock, chatId);
                break;
            case userMessage === '.quote':
                await quoteCommand(sock, chatId);
                break;
            case userMessage === '.حقيقة':
                await factCommand(sock, chatId);
                break;
            case userMessage.startsWith('.طقس'):
                const city = userMessage.slice(9).trim();
                if (city) {
                    await weatherCommand(sock, chatId, city);
                } else {
                    await sock.sendMessage(chatId, { text: 'Please specify a city, e.g., .weather London', ...channelInfo });
                }
                break;
            case userMessage === '.اخبار':
                await newsCommand(sock, chatId);
                break;
            case userMessage.startsWith('.ابدأ-لعبة-xo'):
                const arg = userMessage.split(' ').slice(1).join(' ');
                await tictactoeCommand(sock, chatId, senderId, arg);
                break;
            case userMessage.startsWith('.استسلام'):
                const position = parseInt(userMessage.split(' ')[1]);
                if (isNaN(position)) {
                    await sock.sendMessage(chatId, { text: 'Please provide a valid position number for Tic-Tac-Toe move.', ...channelInfo });
                } else {
                    tictactoeMove(sock, chatId, senderId, position);
                }
                break;
            case userMessage === '.ع-ر-الاعضاء':
                topMembers(sock, chatId, isGroup);
                break;
            case userMessage.startsWith('.شنق'):
                startHangman(sock, chatId);
                break;
            case userMessage.startsWith('.guess'):
                const guessedLetter = userMessage.split(' ')[1];
                if (guessedLetter) {
                    guessLetter(sock, chatId, guessedLetter);
                } else {
                    sock.sendMessage(chatId, { text: 'Please guess a letter using .guess <letter>', ...channelInfo });
                }
                break;
            case userMessage.startsWith('.مجاملة'):
                await complimentCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.اهانة'):
                await insultCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.حظي'):
                const question = userMessage.split(' ').slice(1).join(' ');
                await eightBallCommand(sock, chatId, question);
                break;
            case userMessage.startsWith('.كلمات'):
                const songTitle = userMessage.split(' ').slice(1).join(' ');
                await lyricsCommand(sock, chatId, songTitle);
                break;
            case userMessage.startsWith('.simp'):
                const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                const mentionedJid = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await simpCommand(sock, chatId, quotedMsg, mentionedJid, senderId);
                break;
            case userMessage.startsWith('.stupid') || userMessage.startsWith('.itssostupid') || userMessage.startsWith('.iss'):
                const stupidQuotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                const stupidMentionedJid = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                const stupidArgs = userMessage.split(' ').slice(1);
                await stupidCommand(sock, chatId, stupidQuotedMsg, stupidMentionedJid, senderId, stupidArgs);
                break;
            case userMessage === '.تحدي':
                await dareCommand(sock, chatId);
                break;
            case userMessage === '.مسح-ر-البوت':
                if (isGroup) await clearCommand(sock, chatId);
                break;
            case userMessage.startsWith('.رفع'):
                const mentionedJidListPromote = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await promoteCommand(sock, chatId, mentionedJidListPromote, message);
                break;
            case userMessage.startsWith('.خفض'):
                const mentionedJidListDemote = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await demoteCommand(sock, chatId, mentionedJidListDemote, message);
                break;
            case userMessage === '.حالة-البوت':
                await pingCommand(sock, chatId);
                break;
            case userMessage === '.اختبار':
                await aliveCommand(sock, chatId);
                break;
            case userMessage.startsWith('.تموية'):
                const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                await blurCommand(sock, chatId, message, quotedMessage);
                break;
            case userMessage.startsWith('.ترحيب'):
                if (isGroup) {
                    // Check admin status if not already checked
                    if (!isSenderAdmin) {
                        const adminStatus = await isAdmin(sock, chatId, senderId);
                        isSenderAdmin = adminStatus.isSenderAdmin;
                    }
                    
                    if (isSenderAdmin || message.key.fromMe) {
                        await welcomeCommand(sock, chatId, message);
                    } else {
                        await sock.sendMessage(chatId, { text: 'Sorry, only group admins can use this command.', ...channelInfo });
                    }
                } else {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups.', ...channelInfo });
                }
                break;
            case userMessage.startsWith('.وداع'):
                if (isGroup) {
                    // Check admin status if not already checked
                    if (!isSenderAdmin) {
                        const adminStatus = await isAdmin(sock, chatId, senderId);
                        isSenderAdmin = adminStatus.isSenderAdmin;
                    }
                    
                    if (isSenderAdmin || message.key.fromMe) {
                        await goodbyeCommand(sock, chatId, message);
                    } else {
                        await sock.sendMessage(chatId, { text: 'Sorry, only group admins can use this command.', ...channelInfo });
                    }
                } else {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups.', ...channelInfo });
                }
                break;
            case userMessage === '.جيت':
            case userMessage === '.جيتهوب':
            case userMessage === '.sc':
            case userMessage === '.سكريبت':
            case userMessage === '.ريبو':
                await githubCommand(sock, chatId);
                break;
            case userMessage.startsWith('.منع_شتايم'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups.', ...channelInfo });
                    return;
                }
                
                const adminStatus = await isAdmin(sock, chatId, senderId);
                isSenderAdmin = adminStatus.isSenderAdmin;
                isBotAdmin = adminStatus.isBotAdmin;
                
                if (!isBotAdmin) {
                    await sock.sendMessage(chatId, { text: '*Bot must be admin to use this feature*', ...channelInfo });
                    return;
                }
                
                await antibadwordCommand(sock, chatId, message, senderId, isSenderAdmin);
                break;
            case userMessage.startsWith('.بوت'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups.', ...channelInfo });
                    return;
                }
                
                // Check if sender is admin
                const chatbotAdminStatus = await isAdmin(sock, chatId, senderId);
                if (!chatbotAdminStatus.isSenderAdmin) {
                    await sock.sendMessage(chatId, { text: '*Only admins can use this command*', ...channelInfo });
                    return;
                }
                
                const match = userMessage.slice(8).trim();
                await handleChatbotCommand(sock, chatId, message, match);
                break;
            case userMessage.startsWith('.take'):
                const takeArgs = userMessage.slice(5).trim().split(' ');
                await takeCommand(sock, chatId, message, takeArgs);
                break;
            case userMessage === '.مغازلة':
                await flirtCommand(sock, chatId);
                break;
            case userMessage.startsWith('.شخصية'):
                await characterCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.ويستد'):
                await wastedCommand(sock, chatId, message);
                break;
            case userMessage === '.توافق':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups!', ...channelInfo });
                    return;
                }
                await shipCommand(sock, chatId, message);
                break;
            case userMessage === '.جروبي' || userMessage === '.infogp' || userMessage === '.معلومات-الجروب':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups!', ...channelInfo });
                    return;
                }
                await groupInfoCommand(sock, chatId, message);
                break;
            case userMessage === '.تغيير-لينك' || userMessage === '.جدد-لينك' || userMessage === '.anularlink':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups!', ...channelInfo });
                    return;
                }
                await resetlinkCommand(sock, chatId, senderId);
                break;
            case userMessage === '.الادمين' || userMessage === '.ادمين' || userMessage === '.listadmin':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups!', ...channelInfo });
                    return;
                }
                await staffCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.دمج') || userMessage.startsWith('.emix'):
                await emojimixCommand(sock, chatId, message);
                break;
                case userMessage.startsWith('.tg') || userMessage.startsWith('.stickertelegram') || userMessage.startsWith('.tgsticker') || userMessage.startsWith('.telesticker'):
        
                await stickerTelegramCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.شغل') || userMessage.startsWith('.صوت') || userMessage.startsWith('.mp3') || userMessage.startsWith('.ytmp3') || userMessage.startsWith('.yts'):
                try {
                    const text = userMessage.split(' ').slice(1).join(' ');
                    if (!text) {
                        await sock.sendMessage(chatId, { 
                            text: `✅ Please specify the song you want to download!\n\nExample: .play Sia Unstoppable`,
                            ...channelInfo
                        });
                        return;
                    }

                 

                    const search = await yts(text);
                    if (!search.all || search.all.length === 0) {
                        await sock.sendMessage(chatId, { 
                            text: '❌ No results found!',
                            ...channelInfo
                        });
                        return;
                    }

                    const video = search.all[0];
                    const link = video.url;

                    // Generate the API URL
                    const apiUrl = `https://apis-keith.vercel.app/download/dlmp3?url=${link}`;

                    // Fetch the audio data from the API
                    const response = await fetch(apiUrl);
                    if (!response.ok) {
                        await sock.sendMessage(chatId, { 
                            text: '❌ Failed to fetch data from the API. Please try again.',
                            ...channelInfo
                        });
                        return;
                    }

                    const data = await response.json();

                    if (data.status && data.result) {
                        const { title, downloadUrl, format, quality } = data.result;
                        const thumbnail = video.thumbnail;

                        // Send a message with song details and thumbnail
                        await sock.sendMessage(chatId, {
                            image: { url: thumbnail },
                            caption: `
╭═════════════════⊷
║ *Title*: ${title}
╰═════════════════⊷
*🎵 Downloading song...*`,
                            ...channelInfo
                        });

                        // Send the audio file
                        await sock.sendMessage(chatId, {
                            audio: { url: downloadUrl },
                            mimetype: "audio/mp4"
                        });

                    

                    } else {
                        await sock.sendMessage(chatId, { 
                            text: '❌ Unable to fetch the song. Please try again later.',
                            ...channelInfo
                        });
                    }
                } catch (error) {
                    await sock.sendMessage(chatId, { 
                        text: `❌ An error occurred: ${error.message}`,
                        ...channelInfo
                    });
                }
                break;
            case userMessage === '.vv':
                await viewOnceCommand(sock, chatId, message);
                break;
            case userMessage === '.حذف-السيشن' || userMessage === '.clearsesi':
                await clearSessionCommand(sock, chatId, senderId);
                break;
            case userMessage.startsWith('.حالة-تلقائية'):
                const autoStatusArgs = userMessage.split(' ').slice(1);
                await autoStatusCommand(sock, chatId, senderId, autoStatusArgs);
                break;
            case userMessage.startsWith('.simp'):
                await simpCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.تنصيب') || userMessage.startsWith('.code'): {
                const q = userMessage.split(' ').slice(1).join(' ');
                await pairCommand(sock, chatId, message, q);
                break;
            }
            case userMessage.startsWith('.metallic'):
                await textmakerCommand(sock, chatId, message, userMessage, 'metallic');
                break;
            case userMessage.startsWith('.ice'):
                await textmakerCommand(sock, chatId, message, userMessage, 'ice');
                break;
            case userMessage.startsWith('.snow'):
                await textmakerCommand(sock, chatId, message, userMessage, 'snow');
                break;
            case userMessage.startsWith('.impressive'):
                await textmakerCommand(sock, chatId, message, userMessage, 'impressive');
                break;
            case userMessage.startsWith('.matrix'):
                await textmakerCommand(sock, chatId, message, userMessage, 'matrix');
                break;
            case userMessage.startsWith('.light'):
                await textmakerCommand(sock, chatId, message, userMessage, 'light');
                break;
            case userMessage.startsWith('.neon'):
                await textmakerCommand(sock, chatId, message, userMessage, 'neon');
                break;
            case userMessage.startsWith('.devil'):
                await textmakerCommand(sock, chatId, message, userMessage, 'devil');
                break;
            case userMessage.startsWith('.purple'):
                await textmakerCommand(sock, chatId, message, userMessage, 'purple');
                break;
            case userMessage.startsWith('.thunder'):
                await textmakerCommand(sock, chatId, message, userMessage, 'thunder');
                break;
            case userMessage.startsWith('.leaves'):
                await textmakerCommand(sock, chatId, message, userMessage, 'leaves');
                break;
            case userMessage.startsWith('.1917'):
                await textmakerCommand(sock, chatId, message, userMessage, '1917');
                break;
            case userMessage.startsWith('.arena'):
                await textmakerCommand(sock, chatId, message, userMessage, 'arena');
                break;
            case userMessage.startsWith('.hacker'):
                await textmakerCommand(sock, chatId, message, userMessage, 'hacker');
                break;
            case userMessage.startsWith('.sand'):
                await textmakerCommand(sock, chatId, message, userMessage, 'sand');
                break;
            case userMessage.startsWith('.blackpink'):
                await textmakerCommand(sock, chatId, message, userMessage, 'blackpink');
                break;
            case userMessage.startsWith('.glitch'):
                await textmakerCommand(sock, chatId, message, userMessage, 'glitch');
                break;
            case userMessage.startsWith('.fire'):
                await textmakerCommand(sock, chatId, message, userMessage, 'fire');
                break;
            default:
                if (isGroup) {
                    // Handle non-command group messages
                    if (userMessage) {  // Make sure there's a message
                        await handleChatbotResponse(sock, chatId, message, userMessage, senderId);
                    }
                    await Antilink(message, sock);
                    await handleBadwordDetection(sock, chatId, message, userMessage, senderId);
                }
                break;
        }
    } catch (error) {
        console.error('❌ Error in message handler:', error.message);
        // Only try to send error message if we have a valid chatId
        if (chatId) {
            await sock.sendMessage(chatId, { 
                text: '❌ Failed to process command!',
                ...channelInfo
            });
        }
    }
}

// Instead, export the handlers along with handleMessages
module.exports = { 
    handleMessages,
    handleGroupParticipantUpdate: async (sock, update) => {
        const { id, participants, action, author } = update;
        console.log('Group Update in Main:', {
            id,
            participants,
            action,
            author
        });  // Add this debug log
        
        if (action === 'promote') {
            await handlePromotionEvent(sock, id, participants, author);
        } else if (action === 'خفض') {
            await handleDemotionEvent(sock, id, participants, author);
        }
    },
    handleStatus: async (sock, status) => {
        await handleStatusUpdate(sock, status);
    }
};