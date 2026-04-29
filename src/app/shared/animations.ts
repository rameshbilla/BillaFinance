import {
  trigger,
  transition,
  style,
  query,
  animate,
  group,
} from '@angular/animations';

export const slideInAnimation = trigger('routeAnimations', [
  transition('* <=> *', [
    style({ position: 'relative' }),
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        opacity: 0,
      })
    ], { optional: true }),
    query(':enter', [
      style({ opacity: 0, transform: 'scale(0.98) translateY(10px)' })
    ], { optional: true }),
    group([
      query(':leave', [
        animate('300ms ease-out', style({ opacity: 0, transform: 'scale(1.02) translateY(-10px)' }))
      ], { optional: true }),
      query(':enter', [
        animate('400ms 100ms ease-out', style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
      ], { optional: true })
    ])
  ])
]);
