    function BigNumber (bitsPrecision) 
    {
        var wordsPrecision = bitsPrecision / 16;
        if ((wordsPrecision * 16) < bitsPrecision) { ++wordsPrecision; }
        this.data = new Uint16Array (wordsPrecision);
        this.sign = 1;
        
        this.Add = function (expr)
        {
        }
    }
