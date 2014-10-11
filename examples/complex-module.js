with(require('../')(module)){
    O.import('http')
    O.import('./simple-module',{
        Other : true
    });
    console.info(new Other('Other OF Complex Module'));
}
