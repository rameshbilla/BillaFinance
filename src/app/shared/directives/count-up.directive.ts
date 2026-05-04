import { Directive, ElementRef, Input, Renderer2, OnChanges, SimpleChanges, NgZone, OnDestroy } from '@angular/core';

@Directive({
  selector: '[appCountUp]',
  standalone: true
})
export class CountUpDirective implements OnChanges, OnDestroy {
  @Input('appCountUp') endValue: number | string = 0;
  @Input() duration: number = 1500;
  @Input() prefix: string = '';
  @Input() suffix: string = '';

  private animationFrame: number | null = null;
  private hasAnimated = false;
  private observer: IntersectionObserver | null = null;

  constructor(private el: ElementRef, private renderer: Renderer2, private ngZone: NgZone) {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.hasAnimated) {
          this.hasAnimated = true;
          this.animateCount(0, Number(this.endValue) || 0);
        }
      });
    }, { threshold: 0.1 });
    
    this.observer.observe(this.el.nativeElement);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['endValue'] && !changes['endValue'].isFirstChange()) {
       if (this.hasAnimated) {
         const oldVal = Number(changes['endValue'].previousValue) || 0;
         const newVal = Number(changes['endValue'].currentValue) || 0;
         this.animateCount(oldVal, newVal);
       }
    }
  }

  ngOnDestroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private animateCount(startValue: number, endValue: number) {
    this.ngZone.runOutsideAngular(() => {
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
      }

      const startTime = performance.now();
      const duration = this.duration;

      const step = (currentTime: number) => {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        
        // Easing function (easeOutExpo)
        const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        
        const currentVal = startValue + (endValue - startValue) * easeProgress;
        
        this.updateDOM(Math.floor(currentVal));

        if (progress < 1) {
          this.animationFrame = requestAnimationFrame(step);
        } else {
          this.updateDOM(endValue);
        }
      };

      this.animationFrame = requestAnimationFrame(step);
    });
  }

  private updateDOM(val: number) {
     this.renderer.setProperty(this.el.nativeElement, 'innerHTML', `${this.prefix}${val.toLocaleString('en-IN')}${this.suffix}`);
  }
}
