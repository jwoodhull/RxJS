import {Operator} from '../Operator';
import {Subscriber} from '../Subscriber';
import {Observable} from '../Observable';

/**
 * Maps every value to the same value every time.
 *
 * <img src="./img/mapTo.png" width="100%">
 *
 * @param {any} value the value to map each incoming value to
 * @returns {Observable} an observable of the passed value that emits everytime the source does
 */
export function mapTo<T, R>(value: R): Observable<R> {
  return this.lift(new MapToOperator(value));
}

class MapToOperator<T, R> implements Operator<T, R> {

  value: R;

  constructor(value: R) {
    this.value = value;
  }

  call(subscriber: Subscriber<R>): Subscriber<T> {
    return new MapToSubscriber(subscriber, this.value);
  }
}

class MapToSubscriber<T, R> extends Subscriber<T> {

  value: R;

  constructor(destination: Subscriber<R>, value: R) {
    super(destination);
    this.value = value;
  }

  protected _next(x: T) {
    this.destination.next(this.value);
  }
}
