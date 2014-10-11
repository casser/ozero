with(require('../')(module)){

    require('http','HTTP');
    require('https','HTTPS');
    require('querystring','QS');
    require('url','URL');
    require('./utils','Utils');
    require('./emitter');
    require('./xml');


    /**
     * @class RestRequest
     */
    o.export('RestRequest', Object, {
        constructor : function(action){
            this.action = action
        },
        parse       : function(options){
            var url = options.url;
            if(!url && options.path && options.service){
                url = options.service + options.path;
            }
            url = URL.parse(url,true);
            if(options.query){
                options.query = Utils.merge(url.query,options.query);
            }
            if(!options.method){
                options.method = 'GET';
            }
            url.search     = QS.stringify(url.query);
            options.patch(url);
            if(options.body){
                if(typeof(options.body)=='object'){
                    var type = options.headers['Content-Type'];
                    if(type.indexOf('json')>=0) {
                        options.body = JSON.stringify(options.body );
                    }else{
                        options.body = options.body.toString();
                    }
                }
            }
            this.options = options;
        },
        head        : function(){
            return {
                protocol    : this.options.protocol,
                method      : this.options.method,
                host        : this.options.host,
                hostname    : this.options.hostname,
                port        : this.options.port,
                path        : this.options.path,
                search      : this.options.search,
                headers     : this.options.headers,
            }
        },
        content     : function(){
            return this.options.body;
        },
        hasChunks   : function(){
            return false;
        },
        hasContent  : function(){
            return !!this.options.body
        },
        protocol    : function(){
            return this.options.protocol;
        }
    });

    /**
     * @class RestResponse
     */
    o.export('RestResponse', Object, {
        constructor : function(action){
            this.action = action
        },
        parse  : function(options){
            this.patch(options);
        },
        chunk  : function(chunk){
            if(!this.content){
                this.content = ''
            }
            this.content += chunk;
            this.action.emit('chunk',chunk,this);
        },
        done   : function(){
            if(this.headers){
                var type = this.headers['content-type'];
                if(type.indexOf('/json')>=0) {
                    this.content = JSON.parse(this.content);
                }else
                if(type.indexOf('/xml')>=0){
                    this.content = Xml.parse(this.content);
                }
            }
            this.action.ok(this.content);
        }
    });




    /**
     * @class RestAction
     */
    o.export('RestAction', Object, Emitter, {
        constructor : function(){
            this.request  = new RestRequest(this);
            this.response = new RestResponse(this);
        },
        execute     : function(options){
            this.request.parse(options);
            var transport,channel;
            transport = this.transport(this.request.protocol());
            if(transport){
                console.info(this.request.head())
                channel = transport.request(this.request.head(),this.handle.bind(this))
            }else{
                return this.emit('ko',new Error('unknown protocol'));
            };
            if(this.request.hasChunks()){
                var chunk;
                while(chunk=this.request.chunk()){
                    channel.write(chunk);
                }
            } else
            if(this.request.hasContent()){
                console.info(this.request.content())
                channel.write(this.request.content());
            };
            channel.end();
            return this;
        },
        transport   : function(protocol){
            switch(protocol){
                case 'http:'  : return HTTP;
                case 'https:' : return HTTPS;
            }
        },
        handle      : function(options){
            this.response.parse({
                status   : options.statusCode,
                headers  : options.headers,
            });
            options.setEncoding(this.response.encoding);
            options.on('data', function (chunk) {
                this.response.chunk(chunk);
            }.bind(this));
            options.on('end',function(){
                this.response.done();
            }.bind(this));
        },
        ko          : function(error){
            if(Utils.isFunction(this['before:ko'])){
                var rs = this['before:ko'].call(this,error);
                if(rs){
                    this.emit('ko',rs,this);
                }
            }else{
                this.emit('ko',error,this);
            }
        },
        ok          : function(result){
            if(Utils.isFunction(this['before:ok'])){
                var rs = this['before:ok'].call(this,result);
                if(rs){
                    this.emit('ok',rs,this);
                }
            }else{
                this.emit('ok',result,this);
            }
        }
    });

    /**
     * @class Rest
     */
    o.export('Rest',Object,{
        static       : function(closure){
            Object.defineProperty(closure.class,'rest',{
                enumerable  : false,
                value       : Utils.merge(
                    this.class.rest,
                    closure.class.rest || {}
                )
            })
        },
        '#rest'      : {
            service  : 'http://localhost',
            headers  : {
                'Content-Type' : 'application/json'
            }
        },
        '#instance'    : {
            action   : function(){
                return RestAction;
            },
            request  : function(options){
                return (new (this.action())).execute(
                    Utils.merge(this.class.rest,options)
                );
            },
            get      : function(path,query,body,headers){
                return this.request(Utils.merge({
                    path    : path,
                    query   : query,
                    body    : body,
                    headers : headers,
                },{method : 'GET'}));
            },
            put      : function(path,query,body,headers){
                return this.request(Utils.merge({
                    path    : path,
                    query   : query,
                    body    : body,
                    headers : headers,
                },{method : 'PUT'}));
            },
            post     : function(path,query,body,headers){
                return this.request(Utils.merge({
                    path    : path,
                    query   : query,
                    body    : body,
                    headers : headers,
                },{method : 'POST'}));
            },
            head     : function(path,query,body,headers){
                return this.request(Utils.merge({
                    path    : path,
                    query   : query,
                    body    : body,
                    headers : headers,
                },{method : 'HEAD'}));
            },
            delete   : function(path,query,body,headers){
                return this.request(Utils.merge({
                    path    : path,
                    query   : query,
                    body    : body,
                    headers : headers,
                },{method : 'DELETE'}));
            }
        }
    });
}
