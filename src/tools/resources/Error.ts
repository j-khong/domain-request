const languages = ['en', 'fr'] as const;
export type Language = typeof languages[number];

export class GenericError extends Error {
   public readonly usecaseCode: string;
   public readonly errorCode: string;
   constructor(values: { usecaseCode: string; errorCode: string; message: string }) {
      super(values.message);
      Object.setPrototypeOf(this, GenericError.prototype);
      this.usecaseCode = values.usecaseCode;
      this.errorCode = values.errorCode;
   }

   setLanguage(_lg: unknown): void {}

   serialize(): SerializedError {
      return { message: this.message, usecase_code: this.usecaseCode, code: this.errorCode };
   }

   static unserialize(obj: unknown): GenericError | undefined {
      if (isSerializedError(obj)) {
         return new GenericError({
            usecaseCode: obj.usecase_code,
            errorCode: obj.code,
            message: obj.message,
         });
      }
      return undefined;
   }
}

interface SerializedError {
   message: string;
   usecase_code: string;
   code: string;
}

function isSerializedError(o: unknown): o is SerializedError {
   return isSomethingLike<SerializedError>(o) &&
      isString(o.code) &&
      isString(o.message) &&
      isString(o.usecase_code);
}

function isSomethingLike<T>(given: unknown): given is Partial<Record<keyof T, unknown>> {
   return typeof given === 'object' && given !== null;
}

function isString(o: unknown): o is string {
   return typeof o === 'string';
}
