
export class Review{
    //constructor for reply object
    constructor(data){
        this.productId = data.productId;
        this.uid = data.uid;
        this.email = data.email;
        this.timestamp = data.timestamp;
        this.content = data.content.trim();
    }

    //to store new reply in firestore
    serializeForUpdate(){
        const r = {}
        if(this.productId) r.productId = this.productId;
        if(this.uid) r.uid = this.uid;
        if(this.email) r.email = this.email;
        if(this.timestamp) r.timestamp = this.timestamp;
        if(this.content) r.content = this.content;
        return r;
        
    }

    //to store in Firestore
    serialize(){
        //jscript object
        return{
            productId: this.productId,
            uid: this.uid,
            email: this.email,
            timestamp: this.timestamp,
            content: this.content,
        };
    }

    validate(){
        const errors = {};

        if(!this.content || this.content.length < 5){
            errors.content = "Content too short; min 5 chars"
        }
        return errors
    }
}