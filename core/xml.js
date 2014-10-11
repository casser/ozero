
with(require('../')(module)){
    require('./emitter');
    require('./utils','Utils');

    o.define({
        NAME_START  : /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/,
        NAME_BODY   : /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040\.\d-]/
    })

    /**
     * @class XmlPosition
     */
    o.define('XmlPosition',Object,{
        constructor : function(pos){
            this.index  = pos?pos.index:0;
            this.line   = pos?pos.line:0;
            this.column = pos?pos.column:0;
        },
        clone       : function(){
            return new XmlPosition(this);
        },
        toString    : function(){
            return 'At:('+this.index+' '+this.line+':'+this.column+')'
        }
    });

    /**
     * @class XmlError
     */
    o.define('XmlError',Error,{
        constructor : function(position,message){
            this.message = message;
            this.position = position;
        },
        clone       : function(){
            return new Position(this);
        },
        toString    : function(){
            return 'XmlError '+this.position+' : '+this.message;
        }
    });

    /**
     * @class XmlReader
     */
    o.export('XmlReader', Emitter, {
        '#events'        : {
            error        : Event.class,
            instruction  : Event.class,
            comment      : Event.class,
            doctype      : Event.class,
            cdata        : Event.class,
            text         : Event.class,
            tag_start    : Event.class,
            tag_end      : Event.class
        },
        constructor      : function(handlers){
            this.super(handlers);
            this.position = new XmlPosition();
        },
        error            : function(message){
            this.emit('error',new XmlError(this.position.clone(),message));
        },
        char             : function(){
            this.ch = this.text.charAt(this.position.index++);
            if (this.ch === "\n") {
                this.position.line ++
                this.position.column = 0
            } else {
                this.position.column++
            }
            if(this.ch == ""){
                throw "EOF";
            }
            return this.ch;
        },
        mark             : function(){
            this.mark = {
                i:this.position.index,
                l:this.position.line,
                c:this.position.column
            }
        },
        parse            : function(text){
            this.text = text;
            this.char();
            if(this.isWs()){
                this.skipWs();
            }
            this.parseElement();
        },
        parseElement     : function(){
            try {
                while (this.ch) {
                    if (this.is("<")) {
                        this.char();
                        if (this.is('!')) {
                            this.char();
                            if (this.isIn('-')) {
                                this.emit('comment', this.parseComment());
                            } else
                            if (this.isIn('D')) {
                                this.emit('doctype', this.parseDoctype());
                            } else
                            if (this.isIn('[')) {
                                this.emit('cdata', this.parseCData());
                            } else {
                                this.error('invalid character "' + this.ch + '"');
                            }
                        } else
                        if (this.is('/')) {
                            this.parseEndTag();
                        } else
                        if(this.is('?')){
                            this.emit('instruction', this.parseInstruction());
                        }
                        if (this.isNs()) {
                            this.parseStartTag();
                        }
                    } else {
                        this.emit('text', this.parseText());
                    }
                }
            }catch(er){
                if(er != 'EOF'){
                    this.error(er.toString());
                }
            }
        },
        parseComment     : function(){
            var val = '';
            while(true){
                val += this.ch;
                if(this.char()=='>' && val.substring(val.length-2,val.length)=='--'){
                    break;
                }
            }
            this.char();
            val ='<'+val+'>';
            return val;
        },
        parseInstruction : function(){
            var sch = '';
            var val = sch;
            while(true){
                val += (sch=this.ch);
                if(this.char()=='>' && sch=='?'){
                    break;
                }
            }
            this.char();
            val ='<'+val+'>';
            return val;
        },
        parseStartTag    : function(){
            var name = this.parseName()
            var attributes = {};
            this.skipWs();
            while(!this.isIn('/>')){
                var attr = this.parseAttribute();
                if(!attributes[attr.name]){
                    attributes[attr.name] = attr.value;
                } else
                if(!Utils.isArray(attributes[attr.name])){
                    attributes[attr.name] = [attributes[attr.name],value];
                }else{
                    attributes[attr.name].push(value);
                }
                this.skipWs();
            }
            this.emit('tag_start', {'$name':name, '$':attributes});
            if(this.is('/')){
                this.char();
                if(this.is('>')){
                    this.char();
                    this.emit('tag_end');
                }
            }else
            if(this.is('>')){
                this.char();
            }

        },
        parseEndTag      : function(){
            this.emit('tag_end',this.parseName());
            this.char();
        },
        parseAttribute   : function(){
            this.skipWs();
            var tagname = this.parseName();
            this.skipWs();
            if(this.is('=')){
                this.char();
                return {name:tagname,value:this.parseString()};
            }else{
                this.error('invalid attribute value');
            }
        },
        parseText        : function(){
            var val ='';
            while(!this.is('<')){
                val+=this.ch;
                this.char();
            }
            return val;
        },
        parseString      : function(){
            var sch = this.ch;
            var val = sch;
            while(this.char()!=sch){
                val+=this.ch;
            }
            val+=this.ch;
            this.char();
            return val.substring(1,val.length-1);
        },
        parseName        : function(){
            var tagname = this.ch;
            while(this.char() && this.isNb()){
                tagname += this.ch;
            }
            return tagname;
        },
        skipWs           : function(){
            while(this.isWs()){
                this.char();
            }
        },
        isWs             : function(){
            return this.isIn(" \r\n\t");
        },
        isNb             : function(){
            return !!this.ch.match(NAME_BODY);
        },
        isNs             : function(){
            return !!this.ch.match(NAME_START);
        },
        is               : function(char){
            return this.ch == char;
        },
        isIn             : function(chars){
            return chars.indexOf(this.ch)>=0;
        }
    });

    /**
     * @class XmlNode
     */
    o.export('XmlNode',Object,{
        constructor : function(object){
            this.$          = object.$;
            this.$name      = object.$name;
            this.$text      = object.$text;
            this.$children  = [];
        },
        add         : function(child){
            this.children().push(child);
        },
        child       : function(index){
            return this.children()[index];
        },
        type        : function(value){
            if(this.$text){
                return 'text';
            }else{
                return 'node';
            }
        },
        instruction : function(value){
            if(value){
                this.$instruction = value;
                return this;
            }else{
                return this.$instruction;
            }
        },
        name        : function(value){
            if(value){
                this.$name = value;
                return this;
            }else{
                return this.$name;
            }
        },
        text        : function(value){
            if(value){
                this.$text = value;
                return this;
            }else{
                return this.$text;
            }
        },
        attribute   : function(name,value){
            if(Utils.isObject(name)){
                return Utils.merge(this.$,value);;
            } else
            if(value){
                this.$[name] = value;
                return this;
            } else {
                return this.$[name];
            }
        },
        attributes  : function(value){
            if(value){
                this.$ = value;
                return this;
            }else{
                return this.$;
            }
        },
        children    : function(value){
            if(Utils.isArray(value)){
                this.$children = value;
            }
            return this.$children;
        },
        find        : function(name){
            if(Utils.isString(name)){
                return this.filter(function(item){
                    return item.name()==name;
                });
            }else
            if(Utils.isObject(name)){
                return this.filter(function(item){
                    var match = true;
                    if(match && name.$name){
                        match = match && (item.name()==name.$name);
                    }
                    if(match && name.$){
                        for(var key in name.$){
                            match = match && (item.attribute(key)==name.$[key]);
                            if(!match){
                                break;
                            }
                        }
                    }
                    return match;
                });
            }
        },
        filter      : function(compare){
            var result = [];
            if(compare(this)){
                result.push(this);
            };
            this.children().forEach(function(child){
                var results = child.filter(compare);
                if(results){
                    result = result.concat(results);
                }
            });
            if(result.length==0){
                return false;
            }else
            if(result.length==1){
                return result[0];
            }else{
                return result;
            }
        },
        toObject    : function(){
            var result = {};
            if(this.text()){
                result = this.text()
            } else {
                this.children().forEach(function (child) {
                    var name  = child.name();
                    var value = child.toObject();
                    if (!result[name]) {
                        result[name] = value;
                    }else
                    if(!Utils.isArray(result[name])){
                        result[name] = [result[name],value];
                    }else{
                        result[name].push(value);
                    }
                });
            }
            return result;
        },
        toString    : function(delimeter,level){
            var d = delimeter || '  ', l= level||0 , p = Utils.repeat(d,l);
            var h,f='',att = [],chs=[];
            h = p+'<'+this.name();
            for(var a in this.attributes()){
                att.push(a+'='+'"'+this.attribute(a)+'"');
            }
            if(att.length) {
                h += ' ' + att.join(' ').trim();
            }
            if(this.children().length){
                h+='>';
                for(var c=0;c<this.children().length;c++){
                    chs.push(this.child(c).toString(d,l+1));
                }
                f=p+'</'+this.name()+'>';
            } else
            if(this.text()){
                h+='>'+this.text()+'</'+this.name()+'>';
            } else{
                h+='/>';
            }

            chs.unshift(h);
            if(f) {
                chs.push(f);
            }
            if(this.instruction()){
                chs.unshift(this.instruction());
            }
            return chs.join('\n');
        }
    });

    /**
     * @class XmlParser
     */
    o.export('XmlParser',Object,{
        constructor   : function(options){
            this.reader = new XmlReader({
                'on:error'       : this.onError.bind(this),
                'on:tag_start'   : this.onTagStart.bind(this),
                'on:tag_end'     : this.onTagEnd.bind(this),
                'on:text'        : this.onText.bind(this),
                'on:instruction' : this.onInstruction.bind(this)
            });
        },
        pick          : function(){
            return this.stack[this.stack.length-1];
        },
        push          : function(tag){
            this.stack.push(tag);
        },
        pop           : function(tag){
            return this.stack.pop();
        },
        parse         : function(text){
            this.stack = [];
            this.reader.parse(text);
            if(this.instruction){
                this.root.instruction(this.instruction);
            }
            return this.root;
        },
        onError       : function(event,error){
            throw error;
        },
        onInstruction : function(event,instruction){
            this.instruction = instruction;
        },
        onTagStart    : function(event,tag){
            this.push(new XmlNode(tag));
        },
        onTagEnd      : function(event){
            var child  = this.pop();
            var parent = this.pick();
            if(parent){
                parent.add(child);
            }else{
                this.root = child;
            }
        },
        onText        : function(event,text){
            text = text.trim();
            if(text.length){
                this.pick().text(text);
            }
        }
    });

    /**
     * @class Xml
     */
    o.export('Xml', Object, {
        '#static' : {
            /**
             * @static
             * @param text
             * @return {XmlNode}
             */
            parse     : function(text){
                return (new XmlParser()).parse(text);
            },
            /**
             * @static
             * @param XmlNode
             * @return {String}
             */
            stringify : function(xml){
                return xml.toString();
            },
            /**
             * @static
             * @param text
             * @return {XmlNode}
             */
            node     : function(name){
                var args = Utils.toArray(arguments);
                var node = new XmlNode({$name:args.shift()});
                while(args.length){
                    var next = args.shift();
                    if(Utils.isArray(next)){
                        node.children(next);
                    }else
                    if(Utils.isObject(next)){
                        node.attributes(next);
                    }else{
                        node.text(next.toString());
                    }
                }
                return node;
            }
        }
    })
    //o.export('XmlStream',Object,{});
}