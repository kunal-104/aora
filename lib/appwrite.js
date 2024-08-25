import { ID, Account, Client, Avatars, Databases, Query, Storage } from 'react-native-appwrite';


export const config = {
    endpoint: 'https://cloud.appwrite.io/v1',
    platform: 'com.jsm.aora',
    projectId: '66388ec90028c28be815',
    databaseId: '663890a90001e3aa4de2',
    userCollectionId: '663890d9002395f19ae6',
    videoCollectionId: '6638911100007cd2da80',
    storageId: '663893cb00033a31afec'
};
const {
  endpoint,
  platform,
  projectId,
  databaseId,
  userCollectionId,
  videoCollectionId,
  storageId
} = config;

const client = new Client();

client
  .setEndpoint(config.endpoint)
  .setProject(config.projectId)
  .setPlatform(config.platform);

const account = new Account(client);
const avatars = new Avatars(client);
const databases = new Databases(client);
const storage = new Storage(client);

// export const createUser=()=>{

//   account.create(ID.unique(), 'me@example.com', 'password', 'Jane Doe')
//       .then(function (response) {
//           console.log(response);
//       }, function (error) {
//           console.log(error);
//       });
// }

// Register user
export async function createUser(email, password, username) {
  try {
    const newAccount = await account.create(
      ID.unique(),
      email,
      password,
      username
    );

    if (!newAccount) throw Error;

    const avatarUrl = avatars.getInitials(username);

    await signIn(email, password);

    const newUser = await databases.createDocument(
      config.databaseId,
      config.userCollectionId,
      ID.unique(),
      {
        accountId: newAccount.$id,
        email: email,
        username: username,
        avatar: avatarUrl,
      }
    )

    return newUser;
  } catch (error) {
    throw new Error(error);
  }
}

// Sign In
export async function signIn(email, password) {
  try {
    const session = await account.createEmailSession(email, password);

    return session;
  } catch (error) {
    throw new Error(error);
  }
}

// Get Account
export async function getAccount() {
  try {
    const currentAccount = await account.get();

    return currentAccount;
  } catch (error) {
    throw new Error(error);
  }
}

// Get Current User
export const getCurrentUser = async ()=> {
  try {
    const currentAccount = await getAccount();
    if (!currentAccount) throw Error;

    const currentUser = await databases.listDocuments(
      config.databaseId,
      config.userCollectionId,
      [Query.equal("accountId", currentAccount.$id)]
    )

    if (!currentUser) throw Error;

    // console.log("currentUser.documents[0]");
    return currentUser.documents[0];
  } catch (error) {
    console.log(error);
    return null;
  }
}

// Sign Out
// export async function signOut() {
//   try {
//     const session = await account.deleteSession("current");

//     return session;
//   } catch (error) {
//     throw new Error(error);
//   }
// }

export const getAllPosts = async ()=>{
  try {
    const posts = await databases.listDocuments(
      databaseId,
      videoCollectionId,
      [Query.orderDesc('$createdAt')]
    )
    // console.log('video:', posts)
    
    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

export const getLatestPosts = async ()=>{
  try {
    const posts = await databases.listDocuments(
      databaseId,
      videoCollectionId,
      [Query.orderDesc('$createdAt', Query.limit(7))]
    )
    // console.log('video:', posts)
    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

export const searchPosts = async (query)=>{
  try {
    const posts = await databases.listDocuments(
      databaseId,
      videoCollectionId,
      [Query.search('title', query)]
    )
    // console.log('video:', posts)
    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

export const getUserPosts = async (userId)=>{
  try {
    const posts = await databases.listDocuments(
      databaseId,
      videoCollectionId,
      [Query.equal('creator', userId)]
    )
    // console.log('video:', posts)
    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

export const signOut = async ()=>{
  try {
    const session = await account.deleteSession('current');
    return session;
  } catch (error) {
    throw new Error(error)
  }
}


export const getFilePreview = async (fileId, type)=>{
  let fileUrl;

  try {
    if(type === 'video'){
        fileUrl = storage.getFileView(storageId,fileId)
    } else if( type === 'image'){
      fileUrl = storage.getFilePreview( storageId, fileId, 2000, 2000, 'top', 100)
    } else {
      throw new Error('Invalid file type')
    }

    if(!fileUrl) throw Error;
    return fileUrl;
  } catch (error) {
    throw new Error(error)
  }
}
export const uploadFile= async (file, type)=>{
  if(!file) return;
  // const {mimeType, ...rest } = file;
  // const asset = { type: mimeType, ...rest};
  const asset = {
    name: file.fileName,
    type:  file.mimeType,
    size: file.fileSize,
    uri: file.uri,
  }
  // console.log('Asset file:', asset);
  
  try {
 
    const uploadedFile = await storage.createFile(
      storageId,
      ID.unique(),
      asset
      
    );
   // Log uploadedFile to inspect its structure
   console.log('Uploaded file:', uploadedFile);

    const fileUrl = await getFilePreview(uploadedFile.$id, type);
       // Log uploadedFile to inspect its structure
       console.log(' fileURL:', fileUrl);
    
    return file.uri;

    // return uploadedFile.$id;
  } catch (error) {
    throw new Error(error)
  }
}

export const createVideo = async (form)=>{
  try {
    const [thumbnailUrl, videoUrl ] = await  Promise.all([
      uploadFile(form.thumbnail, 'image'),
      uploadFile(form.video, 'video')
    ])

    const newPost = await databases.createDocument(
      databaseId, videoCollectionId, ID.unique(), {
        title: form.title,
        thumbnail: thumbnailUrl,
        video: videoUrl,
        prompt: form.prompt,
        creator: form.userId
      }
    )
    
    return newPost;
  } catch (error) {
    throw new Error(error);
  }
}   