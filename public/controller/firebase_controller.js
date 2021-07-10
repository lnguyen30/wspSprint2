import { AccountInfo } from '../model/account_info.js';
import * as Constant from '../model/constant.js'
import { Product } from '../model/product.js';
import * as Auth from './auth.js'
import { ShoppingCart } from '../model/ShoppingCart.js';
import { Review } from '../model/review.js';




// calls firebase to sign in user 
export async function signIn(email, password){
    await firebase.auth().signInWithEmailAndPassword(email, password);
}


//call firebase to sign out user
export async function signOut(){
    await firebase.auth().signOut();
}

//creates new users on firebase
export async function createUser(email, password){
    await firebase.auth().createUserWithEmailAndPassword(email, password);
}


//get account info for users
export async function getAccountInfo(uid){
    const doc = await firebase.firestore().collection(Constant.collectionNames.ACCOUNT_INFO)
                        .doc(uid).get();
    // if account exists
    if(doc.exists){
        return new AccountInfo(doc.data())
    }else{//if account hasnt been made yet
        const defaultInfo = AccountInfo.instance();
        //stores new account to firebase with uid, creates new document id with uid
        await firebase.firestore().collection(Constant.collectionNames.ACCOUNT_INFO)
                    .doc(uid).set(defaultInfo.serialize());
        return defaultInfo;

    }
}

// adds cart to firestore database, into purchase history collection
export async function checkOut(cart){
    const data = cart.serialize(Date.now());
    await firebase.firestore().collection(Constant.collectionNames.PURCHASE_HISTORY)
                    .add(data);
}

//update account info
export async function updateAccountInfo(uid, updateInfo){
    //updateInfo: {key: value}
    await firebase.firestore().collection(Constant.collectionNames.ACCOUNT_INFO)
                .doc(uid).update(updateInfo);

}

//uploads profile pic to firebase
export async function uploadProfilePhoto (photoFile, imageName){
    //stores photo to firebase into storage
    const ref = firebase.storage().ref()
        .child(Constant.storageFolderNames.PROFILE_PHOTOS + imageName)
    //stores photo
    const taskSnapShot = await ref.put(photoFile);
    //retrieves the photo url assigned by firebase
    const photoURL = await taskSnapShot.ref.getDownloadURL();
    return photoURL;
}

//updates password for users
export async function updatePassword(newPassword){
    //fetches the current user signed in
    const user = Auth.currentUser
    //call to firebase to update current user's password
    await user.updatePassword(newPassword).then(()=>{
        console.log('update password successful')
    }, (error)=>{
        console.log(error);
    });
 
}

//grabs the purchase from firebase to webpage
export async function getPurchaseHistory(uid){
    // retrieves purchase history from firebase based on the uid, then orders the history by timestamp, 
    //then get() retrieves the info
    const snapShot = await firebase.firestore().collection(Constant.collectionNames.PURCHASE_HISTORY)
                    .where('uid', '==', uid)
                    .orderBy('timestamp', 'desc')
                    .get();
    //empty cart array to store each product
    const carts = [];
    snapShot.forEach(doc =>{
        //creates shopping cart object with product items
        const sc = ShoppingCart.deserialize(doc.data());
        //sc pushed to carts array
        carts.push(sc)
    });

    return carts;
}

// firebase function to fetch all products for home page
export async function getProductListHome(){
    const products = [];
    //fetches all the products information in firebase that are labeled under products label
    const snapshot = await firebase.firestore().collection(Constant.collectionNames.PRODUCTS)
        .orderBy('name')
        .get();

    snapshot.forEach( doc =>{
        //constructs each product with doc.data
        const p = new Product(doc.data())
        //assign the firestore id to product 
        p.docId = doc.id;
        products.push(p);
    })
    return products;
}

//fetches single product for details page
export async function getOneProduct(productId){
    const ref = await firebase.firestore()
            .collection(Constant.collectionNames.PRODUCTS)
            .doc(productId)
            .get();
    if(!ref.exists) return null;
    const p = new Product(ref.data());
    p.docId = productId;
    return p;
}

//adds review to firebase 
export async function addReview(review){
    const ref = await firebase.firestore()
                .collection(Constant.collectionNames.REVIEWS)
                .add(review.serialize());
    return ref.id; //docId of review
}

//gets all reviews into an array
export async function getReviewList(productId){
    const snapShot = await firebase.firestore()
                .collection(Constant.collectionNames.REVIEWS)
                .where('productId', '==', productId)
                .orderBy('timestamp', 'desc') //.orderBy('timestamp', 'desc')
                .get();
    const reviews = [];

    snapShot.forEach(doc=>{
        const r = new Review(doc.data())
        r.docId = doc.id
        reviews.push(r)
    })

    return reviews;
}

export async function getUsersPurchases(uid){
    // retrieves purchase history from firebase based on the uid, 
    //then get() retrieves the info
    const snapShot = await firebase.firestore().collection(Constant.collectionNames.PURCHASE_HISTORY)
                    .where('uid', '==', uid)
                    .get();
    //empty cart array to store each product
    const purchases = [];
    snapShot.forEach(doc =>{
        //creates shopping cart object with product items
        const sc = ShoppingCart.deserialize(doc.data());
        //sc pushed to carts array
        purchases.push(sc)
    });

    return purchases;
    
}

//imports cloud function from to client side
const cf_addProduct = firebase.functions().httpsCallable('cf_addProduct')
export async function addProduct(product){
    await cf_addProduct(product);

}

//upload image to firestore
export async function uploadImage(imageFile, imageName){
    //if image name does not exist, then assign one to imageName
    if(!imageName)
        imageName = Date.now() + imageFile.name;
    
    const ref = firebase.storage().ref()
                        .child(Constant.storageFolderNames.PRODUCT_IMAGES + imageName);//where the image will be stored

    const taskSnapShot = await ref.put(imageFile); //uploads file with the path name
    const imageURL = await taskSnapShot.ref.getDownloadURL(); // gets url of uploaded image 
    return {imageName, imageURL};
}

//calls cloud function to retrieve products
const cf_getProductList = firebase.functions().httpsCallable('cf_getProductList')
export async function getProductList(){
    const products = []; // array of products
    const result = await cf_getProductList(); //result.data
    //iterates through result array and creates new product object then pushes new object into array
    result.data.forEach(data => {
        const p = new Product(data)
        p.docId = data.docId;
        products.push(p)
    });
    //returns array of products
    return products;
}


//calls cloud function to retrieve product by id
const cf_getProductById = firebase.functions().httpsCallable('cf_getProductById')
export async function getProductById(docId){
    const result = await cf_getProductById(docId);
    //if data exists, create product object
    if(result.data){
        const product = new Product(result.data);
        product.docId = result.data.docId;
        return product;
    }else{
        return null;
    }
}

//calls updateProduct to update the product
const cf_updateProduct = firebase.functions().httpsCallable('cf_updateProduct');
export async function updateProduct(product){
    const docId = product.docId;
    //passes in updated values
    const data = product.serializeForUpdate();
    //cloud function
    await cf_updateProduct({docId, data});
}

//calls deleteProduct to delete product
//delete the product first, then image; else, the ref to image will be lost if deleted first
const cf_deleteProduct = firebase.functions().httpsCallable('cf_deleteProduct');
export async function deleteProduct(docId, imageName){
    await cf_deleteProduct(docId);
    //passes the image name to firestore to delete
    const ref = firebase.storage().ref()
                .child(Constant.storageFolderNames.PRODUCT_IMAGES + imageName)
    await ref.delete();
}

//calls getUserList to retrieve users
const cf_getUserList = firebase.functions().httpsCallable('cf_getUserList')
export async function getUserList(){
    const result = await cf_getUserList();
    return result.data;
}

//calls updateUser to updateUser in index.js which updates firestore
const cf_updateUser = firebase.functions().httpsCallable('cf_updateUser')
export async function updateUser(uid, update){
    await cf_updateUser({uid, update});
}

const cf_deleteUser = firebase.functions().httpsCallable('cf_deleteUser')
export async function deleteUser(uid){
    await cf_deleteUser(uid);
}

// calls cf to delete review by docId
const cf_deleteReview = firebase.functions().httpsCallable('cf_deleteReview');
export async function deleteReview(docId){
    await cf_deleteReview(docId);
}

//firebase controller that calls cloud function to get reply by id
const cf_getReviewById = firebase.functions().httpsCallable('cf_getReviewById'); // grabs the cloud function from index.js
export async function getReviewById(docId){
    //result will have the info of reply from docId
    const result = await cf_getReviewById(docId);
    
    //create new review object if data exists
    if(result.data){
        //new review object
        const review = new Review(result.data)
        //assigns docId from result id
        review.docId = result.data.docId
        return review
    }else{
        return null;
    }
}

//cloud function to update reviews
const cf_updateReview = firebase.functions().httpsCallable('cf_updateReview')
export async function updateReview(review){
    const docId = review.docId
    const data = review.serializeForUpdate();
    await cf_updateReview({docId, data});
}

//deleteReview, might pass in user's email for authentication