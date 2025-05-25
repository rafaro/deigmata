import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'IsAfter' })
export class IsAfterConstraint implements ValidatorConstraintInterface {
  validate(value: Date, args: ValidationArguments): boolean {
    const [relatedPropertyName] = args.constraints;
    const relatedValue = ((args.object)[relatedPropertyName] as Date);
    return relatedValue && value >= relatedValue;
  }
}

export function IsAfter(property: string, validationOptions?: ValidationOptions) {
  return (object, propertyName: string): void => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [property],
      validator: IsAfterConstraint,
    });
  };
}
