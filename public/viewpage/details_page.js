import * as Auth from '../controller/auth.js'
import * as Element from './element.js'
import * as Util from './util.js'
import * as FirebaseController from '../controller/firebase_controller.js'
import * as Constant from '../model/constant.js'
import * as  Route from '../controller/route.js'
import {Review} from '../model/review.js';
import * as Edit from '../controller/edit_review.js'



export function addDetailsButtonListeners(){
    //event listener for details buttons
    const detailsButtonForms = document.getElementsByClassName('product-details-form');
    for(let i = 0; i<detailsButtonForms.length; i++){
        //each details button will have event when clicked
        addDetailsFormSubmitEvent(detailsButtonForms[i]);
    }
}

// event listener when details button is clicked
export function addDetailsFormSubmitEvent(form){
    form.addEventListener('submit', e =>{
        e.preventDefault();
        const productId = e.target.productId.value;
        history.pushState(null, null, Route.routePathname.DETAILS + '#' + productId)
        details_page(productId);
    })
}

//event listener for deleting reviews
export function addDeleteEventListeners(deleteForm){
    for(let i = 0; i<deleteForm.length; i++){
        deleteForm[i].addEventListener('submit', async e =>{
            e.preventDefault();
            //confirmation
            if(!window.confirm('Press Ok to delete')) return;
            //disables button
            const button = e.target.getElementsByTagName('button')[0];
            const label = Util.disableButton(button);
            //passes docId to edit_review.js in edit controller
            await Edit.delete_review(e.target.docId.value, e.target.email.value)
            Util.enableButton(button, label);

        })
    }
}


//event listener for update review
export function addUpdateEventListeners(updateForm){
    for(let i = 0; i<updateForm.length; i++){
        updateForm[i].addEventListener('submit', async e =>{
            e.preventDefault();
            //disables button
            const button = e.target.getElementsByTagName('button')[0];
            const label = Util.disableButton(button);
            //passes docId to edit_review.js in edit controller
            await Edit.update_review(e.target.docId.value, e.target.email.value)
            Util.enableButton(button, label);

        })
    }
}

export async function details_page(productId){
    if(!productId){
        Util.info('Error', 'Invalid Product Id: invalid access')
        return;
    }
    //product var for details page
    let product
    //review var for replies
    let reviews
    try{
        //calls firebase to retrieve the single product
        product = await FirebaseController.getOneProduct(productId);
        //if product does not exist
        if(!product){
            Util.info('Error', 'Product Does Not Exist')
            return
        }
        //fetches all reviews for product from firebases function and stores
        // it into an array
        reviews = await FirebaseController.getReviewList(productId)
    }catch(e){
        if(Constant.DEV) console.log(e)
        Util.info('Error', JSON.stringify(e))
        return
    }

    //render the product on page
    let html = `

    <div class="card" style="width: 18rem;">
        <div class="card-header">
            <h4>Product: ${product.name}</h4>
        </div>
        <div class="card-body">
        <img src="${product.imageURL}" class="card-img-top">
            <h5 class="card-title">Summary:  ${product.summary}</h5>
            <p class="card-text">Price:  ${Util.currency(product.price)}</p>
        </div>
    </div>
    <br>
    `;

      //renders review list
      html += '<div id="message-review-body">'
      if(reviews && reviews.length > 0){
          reviews.forEach( r=>{
              html += buildReviewView(r)
          })
      }
      html += '</div>'

    //add new reply
    html += `
        <br>
        <div class="${Auth.currentUser ? 'd-block' : 'd-none'}">
            <textarea  id="textarea-add-new-review" placeholder="Review this product"></textarea>
            <br>
            <button id="button-add-new-review" class="btn btn-outline-info">Post Review</button>
        </div>
    `

    Element.root.innerHTML = html


    //event listener for 'Post Review'
    document.getElementById('button-add-new-review').addEventListener('click', async ()=>{

        //var to check users purchases
        let purchases;

        // fetches list of purchases from firestore with uid
        try{
            purchases = await FirebaseController.getUsersPurchases(Auth.currentUser.uid);
            //if no list exists
            if(purchases.length == 0){
                html += '<h2>No purchase history found</h2>'
                Element.root.innerHTML = html;
                return;
            }
        }catch(e){
            if(Constant.DEV) console.log(e);
            Util.info('Error in getPurchaseHistory', JSON.stringify(e));
        }

       let productCount = 0; // counts amt of certain products in purchase history
       //iterates through purchase history
       for(let i = 0; i<purchases.length; i++){
            purchases[i].items.forEach(item => {
                if(product.name == item.name){
                    productCount++;
                }
            })
       }

       //console.log(productCount) //debugging purposes

       //if user does not have any amt of specific products before purchase, then exit
       if(productCount == 0){
           Util.info('Error', 'Cannot review product yet. Please purchase first');
           return;
       }
       

        //grabs content of review 
        const content = document.getElementById('textarea-add-new-review').value;
        //grabs info of user 
        const uid = Auth.currentUser.uid;
        const email = Auth.currentUser.email;
        const timestamp = Date.now();
        //constructs new reply object
        const review = new Review({
            uid, email, timestamp, content, productId, 
        });

        const button = document.getElementById('button-add-new-review');
        const label = Util.disableButton(button);

        try{
            const docId = await FirebaseController.addReview(review);
            review.docId = docId;
            // // updates page with new review
            // details_page(productId);
        }catch(e){
            if (Const.DEV) console.log(e);
            Util.info('Error', JSON.stringify(e));
        }

        const reviewTag = document.createElement('div')
        reviewTag.innerHTML = buildReviewView(review) // builds reply box
        
        //apends new replies at the bottom of each reply
        document.getElementById('message-review-body').prepend(reviewTag)
        //clears reply box
        document.getElementById('textarea-add-new-review').value = ''

        Util.enableButton(button, label);

        //each time the a review is added, delete reviews event listeners are added to each review
        const deleteReviewsForm = document.getElementsByClassName('form-delete-review')
        addDeleteEventListeners(deleteReviewsForm);

        const updateReviewsForm = document.getElementsByClassName('form-update-review')
        addUpdateEventListeners(updateReviewsForm)
        
    })

 //each time the a details page is rendered, delete reviews event listeners are added to each review
 const deleteReviewsForm = document.getElementsByClassName('form-delete-review')
 addDeleteEventListeners(deleteReviewsForm);

 const updateReviewsForm = document.getElementsByClassName('form-update-review')
 addUpdateEventListeners(updateReviewsForm)

     
}

// includes update button and delete button
//builds reviews for products
function buildReviewView(review){
    return `
        <div id="card-${review.docId}" class="card border border-primary">
            <div class="card-header bg-info text-white">
                Replied by ${review.email} (At ${new Date(review.timestamp).toString()})
            </div>
                <div class="card-body">
                <p class="card-text"> ${review.content} </p>
                <div class="btn-group">
                <form class="form-delete-review ${Auth.currentUser ? 'd-block' : 'd-none'}" method="post">
                    <input type="hidden" name="docId" value=${review.docId}>
                    <input type="hidden" name="email" value=${review.email}>
                    <button class="btn btn-outline-danger" type="post">delete</button>
                </form>
                <form class="form-update-review ${Auth.currentUser ? 'd-block' : 'd-none'}" method="post">
                    <input type="hidden" name="docId" value=${review.docId}>
                    <input type="hidden" name="email" value=${review.email}>
                    <button class="btn btn-outline-primary" type="post">update</button>
                </form>
                </div>
            </div>
        </div>
        <br>
    `;
}



// use compound queries to search through users purchase history
//make function to retrieve user's product from purchase history