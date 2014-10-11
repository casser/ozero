with(require('ozero')(module)){

    require('http','HTTP');
    require('https','HTTPS');

    require('./task');

    o.define({
        Transport    : {
            'http:'  : HTTP,
            'https:' : HTTPS
        }
    })

    /**
     * @class HttpAction
     */
    o.export('HttpAction', Action, {
        execute         : function(input){
            this.doRequest(input)
        },
        onError         : function(e) {
            console.log("Got error: " + e.message);
        },
        doRequest       : function(req){
            var service = Transport[req.protocol];
            var request = service.request(req)
                .on('response',this.onResponse.bind(this))
                .on('error', this.onError.bind(this))
            if(req.body){
                request.write(this.encodeBody(req.body));
            }
            request.end();
        },
        onResponse      : function(res){
            this.status = res.statusCode;
            this.body   = [];
            res.on('error',this.onError.bind(this));
            res.on('data',this.onBodyChunk.bind(this));
            res.on('end',this.onBodyComplete.bind(this));
        },
        onBodyChunk     : function(chunk){
            this.body.push(chunk);
        },
        onBodyComplete  : function(){
            this.body = this.decodeBody(
                this.body = Buffer.concat(this.body)
            );
            this.emit(Action.ON_DONE,this.body);
        },
        encodeBody:function(body){return body.toString()},
        decodeBody:function(body){return body.toString()}
    });

}