import { Product } from "./product.js";

export class ShoppingCart {

    constructor(uid){
        this.uid = uid;
        this.items = []; //array of serialized products objects / shopping cart
    }

    addItem(product){
        //if product already exits in the product array, the push into items array
        // example if product 1 is already in cart, increase it by another 
        const item = this.items.find(e=> product.docId == e.docId);
        //if product is new or no items in cart
        if(!item){
            product.qty = 1;
            //serialize the product
            const newItem = product.serialize();
            //assign new product docId
            newItem.docId = product.docId
            //push it into array
            this.items.push(newItem);
        }else{
            //increase the product by 1
            ++product.qty;// label for each product
            ++item.qty; //shows amount in shopping cart
        }

        this.saveToLocalStorage();
    }


    //arranges cart info to store into firebase
    serialize(timestamp){
        return {uid: this.uid, items: this.items, timestamp};
    }

    
    //takes the json object and rearranges it to create a shopping cart and to display on webpage
    static deserialize(data){
        const sc = new ShoppingCart(data.uid);
        sc.items = data.items;
        sc.timestamp = data.timestamp;
        return sc;
    }

    removeItem(product){
        //dec qty 
        //find the product in the shopping cart by the docId and index
        const index = this.items.findIndex(e => product.docId == e.docId)
        //if item doesn't exist
        if(index<0) return;

        //dec qty in cart
        --this.items[index].qty; // shopping cart dec
        --product.qty; // label of product dec
        if(product.qty == 0){
            this.items.splice(index, 1); // removes shopping cart 
        }

        this.saveToLocalStorage();

    }

    //using windows locatstorage to save items
    saveToLocalStorage(){
        window.localStorage.setItem( `cart-${this.uid}`, this.stringify())
    }

    //helper function savelocalstorage
    stringify(){
        return JSON.stringify({uid: this.uid, items: this.items})
    }

    //validates shopping cart
    isValid(){
        if(!this.uid) return false;
        if(!this.items || !Array.isArray(this.items)) return false;
        for(let i = 0; i < this.items.length; i++){
            //checks if each product can be serialized in array
            if(!Product.isSerializedProduct(this.items[i])) return false;
        }
        return true;
    }

     //parses through stringify cart
     static parse(cartString){
        try{
            if(!cartString) return null;
            const obj = JSON.parse(cartString);
            // json file to shopping cart obj
            const sc = new ShoppingCart(obj.uid)
            sc.items = obj.items
            return sc;
        }catch(e){
            //if parse fails, return null
            return null;
        }
       
    }


    // get amt from shopping cart
    getTotalQty(){
        let n = 0;
        //iterates through cart and inc n by amount of items
        this.items.forEach(e=>{n+=e.qty}) 
        return n;
    }

    //get total price of items
    getTotalPrice(){
        let total = 0;
        this.items.forEach(item=>{
            total += item.price * item.qty;
        });

        return total;
    }

    empty(){
        this.items.length = 0;
    }


}