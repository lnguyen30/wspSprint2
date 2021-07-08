import * as Element from './element.js'
import * as Route from '../controller/route.js'
import * as Auth from '../controller/auth.js'
import * as Home from './home_page.js'
import * as Util from './util.js'
import * as FirebaseController from '../controller/firebase_controller.js'
import * as Constant from '../model/constant.js'

//event listeners for home page
export function addEventListeners(){
    Element.menuCart.addEventListener('click', async ()=>{
        history.pushState(null, null, Route.routePathname.CART);
        await cart_page();
    })
}

//renders shopping cart page
export async function cart_page(){
    if(!Auth.currentUser){
        Element.root.innerHTML = '<h1>Protected Page</h1>'
        return;
    }
    let html ='<h1>Cart Page</h1>'

    // fetches the cart from home page
    const cart = Home.cart;
    // if cart if empty, then return message
    if (!cart || cart.getTotalQty() == 0){
        html +='<h1>Empty cart, Buy More</h1>';
        Element.root.innerHTML = html;
        return;
    }

    //table body for cart page
    html += `
    <table class="table table-striped">
    <thead>
        <tr>
         <th scope="col">Image</th>
         <th scope="col">Name</th>
         <th scope="col">Unit Price</th>
         <th scope="col">Quantity</th>
         <th scope="col">Sub-Total</th>
         <th scope="col" width="50%">Summary</th>

        </tr>
    </thead>
    <tbody>
    `;

    //iterate through each item, table row for each item
    cart.items.forEach(item=>{
        html += `
            <tr>
                <td><img src="${item.imageURL}" width="150px"></td>
                <td>${item.name}</td>
                <td>${Util.currency(item.price)}</td>
                <td>${item.qty}</td>
                <td>${Util.currency(item.qty * item.price)}</td>
                <td>${item.summary}</td>
            </tr>
        `
    });

    html += '</tbody></table>'
    //calls getTotalPrice for total price
    html += `
        <div style="font-size: 150%";>Total: ${Util.currency(cart.getTotalPrice())}</div>
    `
    html += `
        <button id="button-checkout" class="btn btn-outline-primary">Check Out</button>
        <button id="button-continue-shopping" class="btn btn-outline-secondary">Continue Shopping</button>
    `

    Element.root.innerHTML = html;

    //variable for continue button 
    const continueButton =document.getElementById('button-continue-shopping');

    //event listener for continue
    continueButton.addEventListener('click', async () =>{
        // url for home page
        history.pushState(null, null, Route.routePathname.HOME);
        await Home.home_page();
    });

    //variable for checkout button 
    const checkoutButton =document.getElementById('button-checkout');

    //event listener for checkout
    checkoutButton.addEventListener('click', async () =>{

        const label = Util.disableButton(checkoutButton);
        // save cart info as purchase history to firestore
        try{
            await FirebaseController.checkOut(cart);

            // await Util.sleep(1000);
            Util.info('Success', 'Checkout Complete')
            //remove localstorage of cart after checkout is complete, reset cart count, and navigate back to home page
            window.localStorage.removeItem(`cart-${Auth.currentUser.uid}`);
            cart.empty();
            Element.shoppingCartCount.innerHTML = '0';
            history.pushState(null, null, Route.routePathname.HOME);
            await Home.home_page();
        }catch(e){
            if(Constant.DEV) console.log(e);
            Util.info('Checkout Error', JSON.stringify(e));
        }
       
       Util.enableButton(checkoutButton, label);
    });
    

}