import * as Home from '../viewpage/home_page.js'
import * as Purchase from '../viewpage/purchase_page.js'
import * as Cart from '../viewpage/cart.js'
import * as Profile from '../viewpage/profile_page.js'
import * as Product from '../viewpage/product_page.js'
import * as User from '../viewpage/user_page.js'
import * as Details from '../viewpage/details_page.js'


export const routePathname ={
    HOME: '/',
    PURCHASE: '/purchase',
    PROFILE: '/profile',
    CART: '/cart',
    PRODUCT: '/product',
    USER: '/user',
    DETAILS: '/details'

}

// routes for url when buttons are clicked and the functions that associate with the route
export const routes = [
    {pathname: routePathname.HOME, page: Home.home_page}, 
    {pathname: routePathname.PURCHASE, page: Purchase.purchase_page}, 
    {pathname: routePathname.CART, page: Cart.cart_page}, 
    {pathname: routePathname.PROFILE, page: Profile.profile_page}, 
    {pathname: routePathname.PRODUCT, page: Product.product_page}, 
    {pathname: routePathname.USER, page: User.users_page}, 
    {pathname: routePathname.DETAILS, page: Details.details_page}
];

export function routing(pathname, hash){
    const route = routes.find(r=>r.pathname == pathname);
    if (route) {
        if(hash && hash.length > 1) //if hash exists and is greater than 1 including # 
             route.page(hash.substring(1)); //each page will have hash value
        else route.page();
    }else routes[0].page();
}

