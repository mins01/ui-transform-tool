export default class UiTransformTool{
    constructor(area){
        this.area = area;
        this.eventTarget = null;
        this.element = null;
    }

    addEventListener(){
        this.area.addEventListener('pointerdown',this.down)
    }

    down=(event)=>{
        this.eventTarget = event.target;
        this.ondown(event);
        document.addEventListener('pointermove',this.move);
        document.addEventListener('pointerup',this.up);
    }
    move=(event)=>{
        this.onmove(event);
    }
    up=(event)=>{
        this.onup(event);
        document.removeEventListener('pointermove',this.move);
        document.removeEventListener('pointerup',this.up);
        this.eventTarget = null;
    }

    ondown(event){
        if(!this.eventTarget){return false;}
        if(this.eventTarget.classList.contains('dot-00')){ return this.ondownDot00(event); }
        else if(this.eventTarget.classList.contains('dot-01')){ return this.ondownDot01(event); }
        else if(this.eventTarget.classList.contains('dot-02')){ return this.ondownDot02(event); }
        else if(this.eventTarget.classList.contains('dot-10')){ return this.ondownDot10(event); }
        else if(this.eventTarget.classList.contains('dot-11')){ return this.ondownDot11(event); }
        else if(this.eventTarget.classList.contains('dot-12')){ return this.ondownDot12(event); }
        else if(this.eventTarget.classList.contains('dot-20')){ return this.ondownDot20(event); }
        else if(this.eventTarget.classList.contains('dot-21')){ return this.ondownDot21(event); }
        else if(this.eventTarget.classList.contains('dot-22')){ return this.ondownDot22(event); }
        else { return this.ondownArea(event);}
    }
    onmove(event){
        if(!this.eventTarget){return false;}
        if(this.eventTarget.classList.contains('dot-00')){ return this.onmoveDot00(event); }
        else if(this.eventTarget.classList.contains('dot-01')){ return this.onmoveDot01(event); }
        else if(this.eventTarget.classList.contains('dot-02')){ return this.onmoveDot02(event); }
        else if(this.eventTarget.classList.contains('dot-10')){ return this.onmoveDot10(event); }
        else if(this.eventTarget.classList.contains('dot-11')){ return this.onmoveDot11(event); }
        else if(this.eventTarget.classList.contains('dot-12')){ return this.onmoveDot12(event); }
        else if(this.eventTarget.classList.contains('dot-20')){ return this.onmoveDot20(event); }
        else if(this.eventTarget.classList.contains('dot-21')){ return this.onmoveDot21(event); }
        else if(this.eventTarget.classList.contains('dot-22')){ return this.onmoveDot22(event); }
        else { return this.onmoveArea(event);}
    }
    onup(event){
        if(!this.eventTarget){return false;}
        if(this.eventTarget.classList.contains('dot-00')){ return this.onupDot00(event); }
        else if(this.eventTarget.classList.contains('dot-01')){ return this.onupDot01(event); }
        else if(this.eventTarget.classList.contains('dot-02')){ return this.onupDot02(event); }
        else if(this.eventTarget.classList.contains('dot-10')){ return this.onupDot10(event); }
        else if(this.eventTarget.classList.contains('dot-11')){ return this.onupDot11(event); }
        else if(this.eventTarget.classList.contains('dot-12')){ return this.onupDot12(event); }
        else if(this.eventTarget.classList.contains('dot-20')){ return this.onupDot20(event); }
        else if(this.eventTarget.classList.contains('dot-21')){ return this.onupDot21(event); }
        else if(this.eventTarget.classList.contains('dot-22')){ return this.onupDot22(event); }
        else { return this.onupArea(event);}
    }
    
    ondownArea(event){}
    onmoveArea(event){}
    onupArea(event){}

    ondownDot00(event){}
    ondownDot01(event){}
    ondownDot02(event){}
    onmoveDot00(event){}
    onmoveDot01(event){}
    onmoveDot02(event){}
    onupDot00(event){}
    onupDot01(event){}
    onupDot02(event){}

    ondownDot10(event){}
    ondownDot11(event){}
    ondownDot12(event){}
    onmoveDot10(event){}
    onmoveDot11(event){}
    onmoveDot12(event){}
    onupDot10(event){}
    onupDot11(event){}
    onupDot12(event){}

    ondownDot20(event){}
    ondownDot21(event){}
    ondownDot22(event){}
    onmoveDot20(event){}
    onmoveDot21(event){}
    onmoveDot22(event){}
    onupDot20(event){}
    onupDot21(event){}
    onupDot22(event){}
}