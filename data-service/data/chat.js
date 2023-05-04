import { chats } from '../config/mongoCollections.js';
import petData from './pets.js';
import { ObjectId } from 'mongodb';
import validation from '../validation/chat.js';

const createChat = async (
    username1,
    username2,
    nickname1,
    nickname2
) => {
    username1 = validation.checkUsername(username1);
    username2 = validation.checkUsername(username2);
    nickname1 = validation.checkNickname(nickname1);
    nickname2 = validation.checkNickname(nickname2);
    let messages = [];

    const chatCollection = await chats();
    const newChatInfo = {
        username1: username1,
        username2: username2,
        nickname1: nickname1,
        nickname2: nickname2,
        messages: messages
    };

    const insertInfo = await chatCollection.insertOne(newChatInfo);
    if (!insertInfo.acknowledged || !insertInfo.insertedId)
        throw 'Could not create new chat';

    const newChat = await getChatById(insertInfo.insertedId.toString());

    return newChat; 
};

const getChats = async () => {
    const chatCollection = await chats();
    const chatList = await chatCollection.find({}).toArray();
    if (!chatList) throw 'Could not get any chats';
    for (let i = 0, len = chatList.length; i < len; i++){
        chatList[i]._id = chatList[i]._id.toString();
    }
    return chatList;
};

const getChatsByPetId = async(petId) => {
    petId = validation.checkId(petId, "petId");
    const pet = await petData.getPetById(petId);
    let chatIds = pet.chatRoom;
    let chatList = [];
    for (let i = 0, len = chatIds.length; i < len; i++) {
        const chat = await getChatById(chatIds[i]);
        chatList.push(chat);
    }
    return chatList;
}

const getChatById = async (chatId) => {
    chatId = validation.checkId(chatId, 'chatId');

    const chatCollection = await chats();
    const chat = await chatCollection.findOne({_id: ObjectId(chatId)});
    if (!chat) throw 'No chat with that id';
    chat._id = chat._id.toString();
    return chat;
};

const createMessage = async (
    chatId,
    username,
    text
) => {
    chatId = validation.checkId(chatId, 'chatId');
    username = validation.checkUsername(username);
    text = validation.checkString(text, 'message text');
    let time = new Date();

    const chatCollection = await chats();
    const chat = await chatCollection.findOne({_id: ObjectId(chatId)});
    if (!chat) throw 'No chat with that id';

    if (username !== chat.username1 && username != chat.username2){
        throw "Users can only send messages in their own chats";
    }

    let _id = new ObjectId();

    const newMessageInfo = {
        _id: _id,
        username: username,
        time: time,
        text: text
    };
    chat.messages.push(newMessageInfo);

    const updatedInfo = await chatCollection.updateOne(
        {_id: ObjectId(chatId)},
        {$set: {messages: chat.messages}}
    );
    if (updatedInfo.modifiedCount === 0) {
        throw 'Could not update created message successfully';
    }
    const newChat = await chatCollection.findOne({_id: ObjectId(chatId)});
    newChat._id = newChat._id.toString();
    return newChat;
};

const getMessageById = async (
    chatId,
    messageId
) => {
    chatId = validation.checkId(chatId, 'chatId');
    messageId = validation.checkId(messageId, 'messageId');

    const chatCollection = await chats();
    const chat = await chatCollection.findOne({_id: ObjectId(chatId)});
    if (!chat) throw 'No chat with that id';

    let message = null;
    for (let i = 0, len = chat.messages.length; i < len; i++){
        if (chat.messages[i]._id.toString() === messageId){
        message = chat.messages[i];
        break;
        }
    }
    if (!message) throw 'No message with that id in the chat';
    return message;
};

const removeMessage = async (
    chatId,
    messageId
) => {
    chatId = validation.checkId(chatId, 'chatId');
    messageId = validation.checkId(messageId, 'messageId');

    const chatCollection = await chats();
    const chat = await chatCollection.findOne({_id: ObjectId(chatId)});
    if (!chat) throw 'No chat with that id';

    let message = null;
    for (let i = 0, len = chat.messages.length; i < len; i++){
        if (chat.messages[i]._id.toString() === messageId){
        message = chat.messages[i];
        chat.messages.splice(i, 1);
        break;
        }
    }
    if (!message) throw 'No message with that id in the chat';

    const updatedInfo = await chatCollection.updateOne(
        {_id: ObjectId(chatId)},
        {$set: {messages: chat.messages}}
    );
    if (updatedInfo.modifiedCount === 0) {
        throw 'Could not update removed message successfully';
    }

    const newChat = await chatCollection.findOne({_id: ObjectId(chatId)});
    newChat._id = newChat._id.toString();
    return newChat;
}


const exportedMethods = {
    createChat,
    getChats,
    getChatsByPetId,
    getChatById,
    createMessage,
    getMessageById,
    removeMessage
};

export default exportedMethods;