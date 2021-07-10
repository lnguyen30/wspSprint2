import * as Auth from './controller/auth.js'
import * as Home from './viewpage/home_page.js'
import * as Purchase from './viewpage/purchase_page.js'
import * as Cart from './viewpage/cart.js'
import * as Profile from './viewpage/profile_page.js'
import * as Products from './viewpage/product_page.js'
import * as Users from './viewpage/user_page.js'
import * as Route from './controller/route.js'
import * as Update from './controller/edit_review.js'



Auth.addEventListeners();
Home.addEventListeners();
Purchase.addEventListeners();
Cart.addEventListeners();
Profile.addEventListeners();
Products.addEventListeners();
Users.addEventListeners();
Update.addEventListeners();

window.onload = ()=>{
    //fetches the url of the page then passes it to the routing function
    const pathname = window.location.pathname;
    const hash = window.location.hash;
    Route.routing(pathname, hash)
}

window.addEventListener('popstate', e =>{ // updates url after user presses forward or backward 
    e.preventDefault();
    const pathname = e.target.location.pathname;
    const hash = e.target.location.hash;
    Route.routing(pathname, hash);
});