with(require('../')(module)){
    require('./emitter');
    require('./utils','Utils');

    /**
     * @class CsvReader
     */
    o.export('CsvReader', Emitter, {
        '#events'        : {
            header       : Event.class,
            record       : Event.class,
            column       : Event.class,
            end          : Event.class
        },
        '#defaults'      : {
            delimiter    : ',',
            separator    : '\n',
            encloser     : '"',
            escaper      : '"',
            columns      : []
        },
        constructor      : function(options){
            this.super(Utils.merge(this.class.defaults,options));
            this._columns   = !!this.columns.length;
            this._column    = 0;
            this._index     = 0;
            this._line      = {};
            this._text      = '';
            this._enclosing = null;
            this._buffer = new Buffer(0);
        },
        parse            : function(chunk){
            for(var i = 0; i < chunk.length; i++){
                var c = chunk[i];
                if(this.escaper === c && this._enclosing && chunk[i+1] === this.encloser){
                    i++;
                    this._text = this._text + chunk[i];
                }else{
                    if(this.encloser === c){
                        this._enclosing = !this._enclosing;
                    }else
                    if(this.delimiter === c){
                        if(this._enclosing){
                            this._text = this._text + c;
                        }else{
                            if(this._index === 0 && !this._columns){
                                this.columns[this._column] = this._text;
                            }else{
                                this.emit('column',this.columns[this._column],this._text);
                                this._line[this.columns[this._column]] = this._text;
                            }
                            this._text = '';
                            this._column++;
                        }
                    }else
                    if(this.separator === c){ //LF
                        if(this._enclosing){
                            this._text = this._text + c;
                        }else{
                            if(this._text[this._text.length -1] === '\r') {
                                this._text = this._text.slice(0, this._text.length - 1);
                            }
                            if(this._index === 0 && !this._columns){
                                this.columns[this._column] = this._text;
                                this.emit('header',this.columns);
                            }else{
                                this.emit('column',this.columns[this._column],this._text);
                                this._line[this.columns[this._column]] = this._text;
                                this.emit('record',this._line);
                            }
                            this._index++;
                            this._column = 0;
                            this._line = {};
                            this._text = '';
                        }
                    }else{
                        this._text = this._text + c;
                    }
                }
            }
        },
        finish            : function(s){
            if(s) this.parse(s);
            if(this._text || Object.getOwnPropertyNames(this._line).length){
                if(this._text[this._text.length -1] === '\r'){
                    this._text = this._text.slice(0,this._text.length - 1);
                }
                this.emit('column',this.columns[this._column],this._text);
                this._line[this.columns[this._column]] = this._text;
                this.emit('record',this._line);
            }
            this.emit('end');
        },
        end              : function(buffer){
            if(this._buffer || buffer){
                this.write(buffer)
                this.finish();
            }
        },
        write           : function(buffer){
            if(buffer) {
                this._buffer = Buffer.concat(
                    [this._buffer, buffer],
                    this._buffer.length + buffer.length
                );
            }
            this.parse(this._buffer.toString());
            this._buffer = new Buffer(0);
            return true;
        }
    });

}