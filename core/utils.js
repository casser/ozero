with(require('../')(module)){
    require('fs','FS');
    require('path','PATH');

    o.export({
        isDefined           : function(target){
            return (target!==null && target!==undefined);
        },
        isObject            : function(target,strict){
            return typeof(target)=='object' && (strict?(target && target.class===Object.class):true);
        },
        isArray             : function(target){
            return typeof(target)=='object' && target instanceof Array;
        },
        toArray             : function(target){
            var result = [];
            for(var i=0;i<target.length;i++){
                result.push(target[i]);
            }
            return result;
        },
        isFunction          : function(target){
            return typeof(target)=='function';
        },
        isString            : function(target){
            return typeof(target)=='string';
        },
        merge               : function(source,target){
            var k, s, t, o,key,keys=[],result={};
            Object.keys(source).forEach(function(key){
                if(keys.indexOf(key)<0){
                    keys.push(key)
                }
            });
            Object.keys(target).forEach(function(key){
                if(keys.indexOf(key)<0){
                    keys.push(key)
                }
            });
            for(k=0;k<keys.length;k++){
                key = keys[k];
                s   = source[key];
                t   = target[key];
                if(isDefined(s) && isDefined(t)){
                    if(isObject(s,true) && isObject(t,true)){
                        result[key] = merge(s,t);
                    }else{
                        result[key] = t;
                    }
                }else
                if(isDefined(t)){
                    result[key] = t;
                }else
                if(isDefined(s)){
                    result[key] = s;
                }
            }
            return result;
        },
        repeat              : function(str,times){
            var res = '';
            for(var i=0;i<times;i++){
                res = res+str;
            }
            return res;
        },
        fsExist             : function(path){
            return FS.existsSync(path)
        },
        fsRenameExt           : function(path,ext){
            return PATH.dirname(path)+'/'+PATH.basename(path,PATH.extname(PATH.basename(path)))+ext;
        },
        fsDirname           : function(path){
            return PATH.dirname(path)
        },
        fsMakeDir           : function mkdirs(path) {
            var dirs = path.split('/');
            var prevDir = dirs.shift()+"/";
            while(dirs.length > 0) {
                var curDir = prevDir + dirs.shift();
                if (! FS.existsSync(curDir) ) {
                    FS.mkdirSync(curDir);
                }
                prevDir = curDir + '/';
            }
        }
    });
}