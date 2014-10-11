# Define Classes in Javascript

This is a module providing a OOP functionality for javascript,
currently in development.  

## Install

For Node.js

```bash
npm install ozero
```


## How to Use

With Node.js:

```javascript
// simple-module.js 
with(require('ozero')(module)){
    O.import('any-module');
    /**
     * Private class definition 
     * @class PrivateClass
     */
    O.define('PrivateClass', BaseClass, FirstTrait, SecondTrait,{
        '#static'           : {
            STATIC_CONST    : 'static constant value',
            staticField     : 'static field value',
            staticMethod    : function(){
                // ... 
            }
        },
        '#instance'         : {
            constructor     : function(firstParam,secondParam){
                this.super(firstParam); //call to BaseClass.constructor
            },
            instanceField   : 'instance field value'
            instanceMethod  : function(firstParam,secondParam){
                this.super(firstParam); //call to BaseClass.instanceMethod
            }
        }
        
    });
    /**
     * Public or exported class definition 
     * @class PrivateClass
     */
    O.define('PublicClass', BaseClass, FirstTrait, SecondTrait, {
        // ....
    });
}
// simple-module-useage.js
with(require('ozero')(module)){
    O.import('any-module',{
        PublicClass : 'RenamedClass'
    });
    
    RenamedClass.staticMethod('A','B');
    
    var renamed = new RenamedClass();
    renamed.instanceMethod('A','B');
    
}
```
