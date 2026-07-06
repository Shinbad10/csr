
/**
 * Client
**/

import * as runtime from './runtime/client.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model CoSo
 * 
 */
export type CoSo = $Result.DefaultSelection<Prisma.$CoSoPayload>
/**
 * Model NguoiDungCSR
 * 
 */
export type NguoiDungCSR = $Result.DefaultSelection<Prisma.$NguoiDungCSRPayload>
/**
 * Model BuoiKham
 * 
 */
export type BuoiKham = $Result.DefaultSelection<Prisma.$BuoiKhamPayload>
/**
 * Model HoSoBenhNhan
 * 
 */
export type HoSoBenhNhan = $Result.DefaultSelection<Prisma.$HoSoBenhNhanPayload>
/**
 * Model NhatKyTheoDoi
 * 
 */
export type NhatKyTheoDoi = $Result.DefaultSelection<Prisma.$NhatKyTheoDoiPayload>
/**
 * Model AuditLog
 * 
 */
export type AuditLog = $Result.DefaultSelection<Prisma.$AuditLogPayload>
/**
 * Model SyncQueue
 * 
 */
export type SyncQueue = $Result.DefaultSelection<Prisma.$SyncQueuePayload>
/**
 * Model DanhMucBenhVien
 * 
 */
export type DanhMucBenhVien = $Result.DefaultSelection<Prisma.$DanhMucBenhVienPayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient({
 *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
 * })
 * // Fetch zero or more CoSos
 * const coSos = await prisma.coSo.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://pris.ly/d/client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient({
   *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
   * })
   * // Fetch zero or more CoSos
   * const coSos = await prisma.coSo.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://pris.ly/d/client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/orm/prisma-client/queries/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>

  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.coSo`: Exposes CRUD operations for the **CoSo** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more CoSos
    * const coSos = await prisma.coSo.findMany()
    * ```
    */
  get coSo(): Prisma.CoSoDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.nguoiDungCSR`: Exposes CRUD operations for the **NguoiDungCSR** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more NguoiDungCSRS
    * const nguoiDungCSRS = await prisma.nguoiDungCSR.findMany()
    * ```
    */
  get nguoiDungCSR(): Prisma.NguoiDungCSRDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.buoiKham`: Exposes CRUD operations for the **BuoiKham** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more BuoiKhams
    * const buoiKhams = await prisma.buoiKham.findMany()
    * ```
    */
  get buoiKham(): Prisma.BuoiKhamDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.hoSoBenhNhan`: Exposes CRUD operations for the **HoSoBenhNhan** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more HoSoBenhNhans
    * const hoSoBenhNhans = await prisma.hoSoBenhNhan.findMany()
    * ```
    */
  get hoSoBenhNhan(): Prisma.HoSoBenhNhanDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.nhatKyTheoDoi`: Exposes CRUD operations for the **NhatKyTheoDoi** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more NhatKyTheoDois
    * const nhatKyTheoDois = await prisma.nhatKyTheoDoi.findMany()
    * ```
    */
  get nhatKyTheoDoi(): Prisma.NhatKyTheoDoiDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.auditLog`: Exposes CRUD operations for the **AuditLog** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more AuditLogs
    * const auditLogs = await prisma.auditLog.findMany()
    * ```
    */
  get auditLog(): Prisma.AuditLogDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.syncQueue`: Exposes CRUD operations for the **SyncQueue** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SyncQueues
    * const syncQueues = await prisma.syncQueue.findMany()
    * ```
    */
  get syncQueue(): Prisma.SyncQueueDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.danhMucBenhVien`: Exposes CRUD operations for the **DanhMucBenhVien** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more DanhMucBenhViens
    * const danhMucBenhViens = await prisma.danhMucBenhVien.findMany()
    * ```
    */
  get danhMucBenhVien(): Prisma.DanhMucBenhVienDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 7.8.0
   * Query Engine version: 3c6e192761c0362d496ed980de936e2f3cebcd3a
   */
  export type PrismaVersion = {
    client: string
    engine: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    CoSo: 'CoSo',
    NguoiDungCSR: 'NguoiDungCSR',
    BuoiKham: 'BuoiKham',
    HoSoBenhNhan: 'HoSoBenhNhan',
    NhatKyTheoDoi: 'NhatKyTheoDoi',
    AuditLog: 'AuditLog',
    SyncQueue: 'SyncQueue',
    DanhMucBenhVien: 'DanhMucBenhVien'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]



  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "coSo" | "nguoiDungCSR" | "buoiKham" | "hoSoBenhNhan" | "nhatKyTheoDoi" | "auditLog" | "syncQueue" | "danhMucBenhVien"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      CoSo: {
        payload: Prisma.$CoSoPayload<ExtArgs>
        fields: Prisma.CoSoFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CoSoFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoSoPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CoSoFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoSoPayload>
          }
          findFirst: {
            args: Prisma.CoSoFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoSoPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CoSoFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoSoPayload>
          }
          findMany: {
            args: Prisma.CoSoFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoSoPayload>[]
          }
          create: {
            args: Prisma.CoSoCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoSoPayload>
          }
          createMany: {
            args: Prisma.CoSoCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CoSoCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoSoPayload>[]
          }
          delete: {
            args: Prisma.CoSoDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoSoPayload>
          }
          update: {
            args: Prisma.CoSoUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoSoPayload>
          }
          deleteMany: {
            args: Prisma.CoSoDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CoSoUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CoSoUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoSoPayload>[]
          }
          upsert: {
            args: Prisma.CoSoUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoSoPayload>
          }
          aggregate: {
            args: Prisma.CoSoAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCoSo>
          }
          groupBy: {
            args: Prisma.CoSoGroupByArgs<ExtArgs>
            result: $Utils.Optional<CoSoGroupByOutputType>[]
          }
          count: {
            args: Prisma.CoSoCountArgs<ExtArgs>
            result: $Utils.Optional<CoSoCountAggregateOutputType> | number
          }
        }
      }
      NguoiDungCSR: {
        payload: Prisma.$NguoiDungCSRPayload<ExtArgs>
        fields: Prisma.NguoiDungCSRFieldRefs
        operations: {
          findUnique: {
            args: Prisma.NguoiDungCSRFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NguoiDungCSRPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.NguoiDungCSRFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NguoiDungCSRPayload>
          }
          findFirst: {
            args: Prisma.NguoiDungCSRFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NguoiDungCSRPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.NguoiDungCSRFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NguoiDungCSRPayload>
          }
          findMany: {
            args: Prisma.NguoiDungCSRFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NguoiDungCSRPayload>[]
          }
          create: {
            args: Prisma.NguoiDungCSRCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NguoiDungCSRPayload>
          }
          createMany: {
            args: Prisma.NguoiDungCSRCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.NguoiDungCSRCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NguoiDungCSRPayload>[]
          }
          delete: {
            args: Prisma.NguoiDungCSRDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NguoiDungCSRPayload>
          }
          update: {
            args: Prisma.NguoiDungCSRUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NguoiDungCSRPayload>
          }
          deleteMany: {
            args: Prisma.NguoiDungCSRDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.NguoiDungCSRUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.NguoiDungCSRUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NguoiDungCSRPayload>[]
          }
          upsert: {
            args: Prisma.NguoiDungCSRUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NguoiDungCSRPayload>
          }
          aggregate: {
            args: Prisma.NguoiDungCSRAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateNguoiDungCSR>
          }
          groupBy: {
            args: Prisma.NguoiDungCSRGroupByArgs<ExtArgs>
            result: $Utils.Optional<NguoiDungCSRGroupByOutputType>[]
          }
          count: {
            args: Prisma.NguoiDungCSRCountArgs<ExtArgs>
            result: $Utils.Optional<NguoiDungCSRCountAggregateOutputType> | number
          }
        }
      }
      BuoiKham: {
        payload: Prisma.$BuoiKhamPayload<ExtArgs>
        fields: Prisma.BuoiKhamFieldRefs
        operations: {
          findUnique: {
            args: Prisma.BuoiKhamFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BuoiKhamPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.BuoiKhamFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BuoiKhamPayload>
          }
          findFirst: {
            args: Prisma.BuoiKhamFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BuoiKhamPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.BuoiKhamFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BuoiKhamPayload>
          }
          findMany: {
            args: Prisma.BuoiKhamFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BuoiKhamPayload>[]
          }
          create: {
            args: Prisma.BuoiKhamCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BuoiKhamPayload>
          }
          createMany: {
            args: Prisma.BuoiKhamCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.BuoiKhamCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BuoiKhamPayload>[]
          }
          delete: {
            args: Prisma.BuoiKhamDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BuoiKhamPayload>
          }
          update: {
            args: Prisma.BuoiKhamUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BuoiKhamPayload>
          }
          deleteMany: {
            args: Prisma.BuoiKhamDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.BuoiKhamUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.BuoiKhamUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BuoiKhamPayload>[]
          }
          upsert: {
            args: Prisma.BuoiKhamUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BuoiKhamPayload>
          }
          aggregate: {
            args: Prisma.BuoiKhamAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateBuoiKham>
          }
          groupBy: {
            args: Prisma.BuoiKhamGroupByArgs<ExtArgs>
            result: $Utils.Optional<BuoiKhamGroupByOutputType>[]
          }
          count: {
            args: Prisma.BuoiKhamCountArgs<ExtArgs>
            result: $Utils.Optional<BuoiKhamCountAggregateOutputType> | number
          }
        }
      }
      HoSoBenhNhan: {
        payload: Prisma.$HoSoBenhNhanPayload<ExtArgs>
        fields: Prisma.HoSoBenhNhanFieldRefs
        operations: {
          findUnique: {
            args: Prisma.HoSoBenhNhanFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HoSoBenhNhanPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.HoSoBenhNhanFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HoSoBenhNhanPayload>
          }
          findFirst: {
            args: Prisma.HoSoBenhNhanFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HoSoBenhNhanPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.HoSoBenhNhanFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HoSoBenhNhanPayload>
          }
          findMany: {
            args: Prisma.HoSoBenhNhanFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HoSoBenhNhanPayload>[]
          }
          create: {
            args: Prisma.HoSoBenhNhanCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HoSoBenhNhanPayload>
          }
          createMany: {
            args: Prisma.HoSoBenhNhanCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.HoSoBenhNhanCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HoSoBenhNhanPayload>[]
          }
          delete: {
            args: Prisma.HoSoBenhNhanDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HoSoBenhNhanPayload>
          }
          update: {
            args: Prisma.HoSoBenhNhanUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HoSoBenhNhanPayload>
          }
          deleteMany: {
            args: Prisma.HoSoBenhNhanDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.HoSoBenhNhanUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.HoSoBenhNhanUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HoSoBenhNhanPayload>[]
          }
          upsert: {
            args: Prisma.HoSoBenhNhanUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HoSoBenhNhanPayload>
          }
          aggregate: {
            args: Prisma.HoSoBenhNhanAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateHoSoBenhNhan>
          }
          groupBy: {
            args: Prisma.HoSoBenhNhanGroupByArgs<ExtArgs>
            result: $Utils.Optional<HoSoBenhNhanGroupByOutputType>[]
          }
          count: {
            args: Prisma.HoSoBenhNhanCountArgs<ExtArgs>
            result: $Utils.Optional<HoSoBenhNhanCountAggregateOutputType> | number
          }
        }
      }
      NhatKyTheoDoi: {
        payload: Prisma.$NhatKyTheoDoiPayload<ExtArgs>
        fields: Prisma.NhatKyTheoDoiFieldRefs
        operations: {
          findUnique: {
            args: Prisma.NhatKyTheoDoiFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NhatKyTheoDoiPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.NhatKyTheoDoiFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NhatKyTheoDoiPayload>
          }
          findFirst: {
            args: Prisma.NhatKyTheoDoiFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NhatKyTheoDoiPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.NhatKyTheoDoiFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NhatKyTheoDoiPayload>
          }
          findMany: {
            args: Prisma.NhatKyTheoDoiFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NhatKyTheoDoiPayload>[]
          }
          create: {
            args: Prisma.NhatKyTheoDoiCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NhatKyTheoDoiPayload>
          }
          createMany: {
            args: Prisma.NhatKyTheoDoiCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.NhatKyTheoDoiCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NhatKyTheoDoiPayload>[]
          }
          delete: {
            args: Prisma.NhatKyTheoDoiDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NhatKyTheoDoiPayload>
          }
          update: {
            args: Prisma.NhatKyTheoDoiUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NhatKyTheoDoiPayload>
          }
          deleteMany: {
            args: Prisma.NhatKyTheoDoiDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.NhatKyTheoDoiUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.NhatKyTheoDoiUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NhatKyTheoDoiPayload>[]
          }
          upsert: {
            args: Prisma.NhatKyTheoDoiUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NhatKyTheoDoiPayload>
          }
          aggregate: {
            args: Prisma.NhatKyTheoDoiAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateNhatKyTheoDoi>
          }
          groupBy: {
            args: Prisma.NhatKyTheoDoiGroupByArgs<ExtArgs>
            result: $Utils.Optional<NhatKyTheoDoiGroupByOutputType>[]
          }
          count: {
            args: Prisma.NhatKyTheoDoiCountArgs<ExtArgs>
            result: $Utils.Optional<NhatKyTheoDoiCountAggregateOutputType> | number
          }
        }
      }
      AuditLog: {
        payload: Prisma.$AuditLogPayload<ExtArgs>
        fields: Prisma.AuditLogFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AuditLogFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditLogPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AuditLogFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditLogPayload>
          }
          findFirst: {
            args: Prisma.AuditLogFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditLogPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AuditLogFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditLogPayload>
          }
          findMany: {
            args: Prisma.AuditLogFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditLogPayload>[]
          }
          create: {
            args: Prisma.AuditLogCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditLogPayload>
          }
          createMany: {
            args: Prisma.AuditLogCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AuditLogCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditLogPayload>[]
          }
          delete: {
            args: Prisma.AuditLogDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditLogPayload>
          }
          update: {
            args: Prisma.AuditLogUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditLogPayload>
          }
          deleteMany: {
            args: Prisma.AuditLogDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AuditLogUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.AuditLogUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditLogPayload>[]
          }
          upsert: {
            args: Prisma.AuditLogUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditLogPayload>
          }
          aggregate: {
            args: Prisma.AuditLogAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAuditLog>
          }
          groupBy: {
            args: Prisma.AuditLogGroupByArgs<ExtArgs>
            result: $Utils.Optional<AuditLogGroupByOutputType>[]
          }
          count: {
            args: Prisma.AuditLogCountArgs<ExtArgs>
            result: $Utils.Optional<AuditLogCountAggregateOutputType> | number
          }
        }
      }
      SyncQueue: {
        payload: Prisma.$SyncQueuePayload<ExtArgs>
        fields: Prisma.SyncQueueFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SyncQueueFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncQueuePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SyncQueueFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncQueuePayload>
          }
          findFirst: {
            args: Prisma.SyncQueueFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncQueuePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SyncQueueFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncQueuePayload>
          }
          findMany: {
            args: Prisma.SyncQueueFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncQueuePayload>[]
          }
          create: {
            args: Prisma.SyncQueueCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncQueuePayload>
          }
          createMany: {
            args: Prisma.SyncQueueCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SyncQueueCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncQueuePayload>[]
          }
          delete: {
            args: Prisma.SyncQueueDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncQueuePayload>
          }
          update: {
            args: Prisma.SyncQueueUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncQueuePayload>
          }
          deleteMany: {
            args: Prisma.SyncQueueDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SyncQueueUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SyncQueueUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncQueuePayload>[]
          }
          upsert: {
            args: Prisma.SyncQueueUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncQueuePayload>
          }
          aggregate: {
            args: Prisma.SyncQueueAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSyncQueue>
          }
          groupBy: {
            args: Prisma.SyncQueueGroupByArgs<ExtArgs>
            result: $Utils.Optional<SyncQueueGroupByOutputType>[]
          }
          count: {
            args: Prisma.SyncQueueCountArgs<ExtArgs>
            result: $Utils.Optional<SyncQueueCountAggregateOutputType> | number
          }
        }
      }
      DanhMucBenhVien: {
        payload: Prisma.$DanhMucBenhVienPayload<ExtArgs>
        fields: Prisma.DanhMucBenhVienFieldRefs
        operations: {
          findUnique: {
            args: Prisma.DanhMucBenhVienFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DanhMucBenhVienPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.DanhMucBenhVienFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DanhMucBenhVienPayload>
          }
          findFirst: {
            args: Prisma.DanhMucBenhVienFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DanhMucBenhVienPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.DanhMucBenhVienFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DanhMucBenhVienPayload>
          }
          findMany: {
            args: Prisma.DanhMucBenhVienFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DanhMucBenhVienPayload>[]
          }
          create: {
            args: Prisma.DanhMucBenhVienCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DanhMucBenhVienPayload>
          }
          createMany: {
            args: Prisma.DanhMucBenhVienCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.DanhMucBenhVienCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DanhMucBenhVienPayload>[]
          }
          delete: {
            args: Prisma.DanhMucBenhVienDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DanhMucBenhVienPayload>
          }
          update: {
            args: Prisma.DanhMucBenhVienUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DanhMucBenhVienPayload>
          }
          deleteMany: {
            args: Prisma.DanhMucBenhVienDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.DanhMucBenhVienUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.DanhMucBenhVienUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DanhMucBenhVienPayload>[]
          }
          upsert: {
            args: Prisma.DanhMucBenhVienUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DanhMucBenhVienPayload>
          }
          aggregate: {
            args: Prisma.DanhMucBenhVienAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateDanhMucBenhVien>
          }
          groupBy: {
            args: Prisma.DanhMucBenhVienGroupByArgs<ExtArgs>
            result: $Utils.Optional<DanhMucBenhVienGroupByOutputType>[]
          }
          count: {
            args: Prisma.DanhMucBenhVienCountArgs<ExtArgs>
            result: $Utils.Optional<DanhMucBenhVienCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://pris.ly/d/logging).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory
    /**
     * Prisma Accelerate URL allowing the client to connect through Accelerate instead of a direct database.
     */
    accelerateUrl?: string
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
    /**
     * SQL commenter plugins that add metadata to SQL queries as comments.
     * Comments follow the sqlcommenter format: https://google.github.io/sqlcommenter/
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   adapter,
     *   comments: [
     *     traceContext(),
     *     queryInsights(),
     *   ],
     * })
     * ```
     */
    comments?: runtime.SqlCommenterPlugin[]
  }
  export type GlobalOmitConfig = {
    coSo?: CoSoOmit
    nguoiDungCSR?: NguoiDungCSROmit
    buoiKham?: BuoiKhamOmit
    hoSoBenhNhan?: HoSoBenhNhanOmit
    nhatKyTheoDoi?: NhatKyTheoDoiOmit
    auditLog?: AuditLogOmit
    syncQueue?: SyncQueueOmit
    danhMucBenhVien?: DanhMucBenhVienOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type CoSoCountOutputType
   */

  export type CoSoCountOutputType = {
    buoiKham: number
    nguoiDung: number
    hoSo: number
  }

  export type CoSoCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    buoiKham?: boolean | CoSoCountOutputTypeCountBuoiKhamArgs
    nguoiDung?: boolean | CoSoCountOutputTypeCountNguoiDungArgs
    hoSo?: boolean | CoSoCountOutputTypeCountHoSoArgs
  }

  // Custom InputTypes
  /**
   * CoSoCountOutputType without action
   */
  export type CoSoCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CoSoCountOutputType
     */
    select?: CoSoCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * CoSoCountOutputType without action
   */
  export type CoSoCountOutputTypeCountBuoiKhamArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BuoiKhamWhereInput
  }

  /**
   * CoSoCountOutputType without action
   */
  export type CoSoCountOutputTypeCountNguoiDungArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: NguoiDungCSRWhereInput
  }

  /**
   * CoSoCountOutputType without action
   */
  export type CoSoCountOutputTypeCountHoSoArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: HoSoBenhNhanWhereInput
  }


  /**
   * Count Type NguoiDungCSRCountOutputType
   */

  export type NguoiDungCSRCountOutputType = {
    buoiKhamTao: number
    hoSoTuVan: number
    hoSoPhuTrach: number
    hoSoChotCuoi: number
    nhatKy: number
  }

  export type NguoiDungCSRCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    buoiKhamTao?: boolean | NguoiDungCSRCountOutputTypeCountBuoiKhamTaoArgs
    hoSoTuVan?: boolean | NguoiDungCSRCountOutputTypeCountHoSoTuVanArgs
    hoSoPhuTrach?: boolean | NguoiDungCSRCountOutputTypeCountHoSoPhuTrachArgs
    hoSoChotCuoi?: boolean | NguoiDungCSRCountOutputTypeCountHoSoChotCuoiArgs
    nhatKy?: boolean | NguoiDungCSRCountOutputTypeCountNhatKyArgs
  }

  // Custom InputTypes
  /**
   * NguoiDungCSRCountOutputType without action
   */
  export type NguoiDungCSRCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NguoiDungCSRCountOutputType
     */
    select?: NguoiDungCSRCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * NguoiDungCSRCountOutputType without action
   */
  export type NguoiDungCSRCountOutputTypeCountBuoiKhamTaoArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BuoiKhamWhereInput
  }

  /**
   * NguoiDungCSRCountOutputType without action
   */
  export type NguoiDungCSRCountOutputTypeCountHoSoTuVanArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: HoSoBenhNhanWhereInput
  }

  /**
   * NguoiDungCSRCountOutputType without action
   */
  export type NguoiDungCSRCountOutputTypeCountHoSoPhuTrachArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: HoSoBenhNhanWhereInput
  }

  /**
   * NguoiDungCSRCountOutputType without action
   */
  export type NguoiDungCSRCountOutputTypeCountHoSoChotCuoiArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: HoSoBenhNhanWhereInput
  }

  /**
   * NguoiDungCSRCountOutputType without action
   */
  export type NguoiDungCSRCountOutputTypeCountNhatKyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: NhatKyTheoDoiWhereInput
  }


  /**
   * Count Type BuoiKhamCountOutputType
   */

  export type BuoiKhamCountOutputType = {
    hoSo: number
  }

  export type BuoiKhamCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    hoSo?: boolean | BuoiKhamCountOutputTypeCountHoSoArgs
  }

  // Custom InputTypes
  /**
   * BuoiKhamCountOutputType without action
   */
  export type BuoiKhamCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BuoiKhamCountOutputType
     */
    select?: BuoiKhamCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * BuoiKhamCountOutputType without action
   */
  export type BuoiKhamCountOutputTypeCountHoSoArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: HoSoBenhNhanWhereInput
  }


  /**
   * Count Type HoSoBenhNhanCountOutputType
   */

  export type HoSoBenhNhanCountOutputType = {
    nhatKy: number
  }

  export type HoSoBenhNhanCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    nhatKy?: boolean | HoSoBenhNhanCountOutputTypeCountNhatKyArgs
  }

  // Custom InputTypes
  /**
   * HoSoBenhNhanCountOutputType without action
   */
  export type HoSoBenhNhanCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HoSoBenhNhanCountOutputType
     */
    select?: HoSoBenhNhanCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * HoSoBenhNhanCountOutputType without action
   */
  export type HoSoBenhNhanCountOutputTypeCountNhatKyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: NhatKyTheoDoiWhereInput
  }


  /**
   * Models
   */

  /**
   * Model CoSo
   */

  export type AggregateCoSo = {
    _count: CoSoCountAggregateOutputType | null
    _min: CoSoMinAggregateOutputType | null
    _max: CoSoMaxAggregateOutputType | null
  }

  export type CoSoMinAggregateOutputType = {
    id: string | null
    ten: string | null
    diaChi: string | null
    trangThai: string | null
    sheetId: string | null
    bhxhUser: string | null
    bhxhPass: string | null
    bhxhMaCSKCB: string | null
    bhxhHoTenCB: string | null
    bhxhCccdCB: string | null
    hisHost: string | null
    hisPort: string | null
    hisUser: string | null
    hisPass: string | null
    hisDbName: string | null
  }

  export type CoSoMaxAggregateOutputType = {
    id: string | null
    ten: string | null
    diaChi: string | null
    trangThai: string | null
    sheetId: string | null
    bhxhUser: string | null
    bhxhPass: string | null
    bhxhMaCSKCB: string | null
    bhxhHoTenCB: string | null
    bhxhCccdCB: string | null
    hisHost: string | null
    hisPort: string | null
    hisUser: string | null
    hisPass: string | null
    hisDbName: string | null
  }

  export type CoSoCountAggregateOutputType = {
    id: number
    ten: number
    diaChi: number
    trangThai: number
    sheetId: number
    bhxhUser: number
    bhxhPass: number
    bhxhMaCSKCB: number
    bhxhHoTenCB: number
    bhxhCccdCB: number
    hisHost: number
    hisPort: number
    hisUser: number
    hisPass: number
    hisDbName: number
    _all: number
  }


  export type CoSoMinAggregateInputType = {
    id?: true
    ten?: true
    diaChi?: true
    trangThai?: true
    sheetId?: true
    bhxhUser?: true
    bhxhPass?: true
    bhxhMaCSKCB?: true
    bhxhHoTenCB?: true
    bhxhCccdCB?: true
    hisHost?: true
    hisPort?: true
    hisUser?: true
    hisPass?: true
    hisDbName?: true
  }

  export type CoSoMaxAggregateInputType = {
    id?: true
    ten?: true
    diaChi?: true
    trangThai?: true
    sheetId?: true
    bhxhUser?: true
    bhxhPass?: true
    bhxhMaCSKCB?: true
    bhxhHoTenCB?: true
    bhxhCccdCB?: true
    hisHost?: true
    hisPort?: true
    hisUser?: true
    hisPass?: true
    hisDbName?: true
  }

  export type CoSoCountAggregateInputType = {
    id?: true
    ten?: true
    diaChi?: true
    trangThai?: true
    sheetId?: true
    bhxhUser?: true
    bhxhPass?: true
    bhxhMaCSKCB?: true
    bhxhHoTenCB?: true
    bhxhCccdCB?: true
    hisHost?: true
    hisPort?: true
    hisUser?: true
    hisPass?: true
    hisDbName?: true
    _all?: true
  }

  export type CoSoAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CoSo to aggregate.
     */
    where?: CoSoWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CoSos to fetch.
     */
    orderBy?: CoSoOrderByWithRelationInput | CoSoOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CoSoWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CoSos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CoSos.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned CoSos
    **/
    _count?: true | CoSoCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CoSoMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CoSoMaxAggregateInputType
  }

  export type GetCoSoAggregateType<T extends CoSoAggregateArgs> = {
        [P in keyof T & keyof AggregateCoSo]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCoSo[P]>
      : GetScalarType<T[P], AggregateCoSo[P]>
  }




  export type CoSoGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CoSoWhereInput
    orderBy?: CoSoOrderByWithAggregationInput | CoSoOrderByWithAggregationInput[]
    by: CoSoScalarFieldEnum[] | CoSoScalarFieldEnum
    having?: CoSoScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CoSoCountAggregateInputType | true
    _min?: CoSoMinAggregateInputType
    _max?: CoSoMaxAggregateInputType
  }

  export type CoSoGroupByOutputType = {
    id: string
    ten: string
    diaChi: string | null
    trangThai: string
    sheetId: string | null
    bhxhUser: string | null
    bhxhPass: string | null
    bhxhMaCSKCB: string | null
    bhxhHoTenCB: string | null
    bhxhCccdCB: string | null
    hisHost: string | null
    hisPort: string | null
    hisUser: string | null
    hisPass: string | null
    hisDbName: string | null
    _count: CoSoCountAggregateOutputType | null
    _min: CoSoMinAggregateOutputType | null
    _max: CoSoMaxAggregateOutputType | null
  }

  type GetCoSoGroupByPayload<T extends CoSoGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CoSoGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CoSoGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CoSoGroupByOutputType[P]>
            : GetScalarType<T[P], CoSoGroupByOutputType[P]>
        }
      >
    >


  export type CoSoSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    ten?: boolean
    diaChi?: boolean
    trangThai?: boolean
    sheetId?: boolean
    bhxhUser?: boolean
    bhxhPass?: boolean
    bhxhMaCSKCB?: boolean
    bhxhHoTenCB?: boolean
    bhxhCccdCB?: boolean
    hisHost?: boolean
    hisPort?: boolean
    hisUser?: boolean
    hisPass?: boolean
    hisDbName?: boolean
    buoiKham?: boolean | CoSo$buoiKhamArgs<ExtArgs>
    nguoiDung?: boolean | CoSo$nguoiDungArgs<ExtArgs>
    hoSo?: boolean | CoSo$hoSoArgs<ExtArgs>
    _count?: boolean | CoSoCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["coSo"]>

  export type CoSoSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    ten?: boolean
    diaChi?: boolean
    trangThai?: boolean
    sheetId?: boolean
    bhxhUser?: boolean
    bhxhPass?: boolean
    bhxhMaCSKCB?: boolean
    bhxhHoTenCB?: boolean
    bhxhCccdCB?: boolean
    hisHost?: boolean
    hisPort?: boolean
    hisUser?: boolean
    hisPass?: boolean
    hisDbName?: boolean
  }, ExtArgs["result"]["coSo"]>

  export type CoSoSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    ten?: boolean
    diaChi?: boolean
    trangThai?: boolean
    sheetId?: boolean
    bhxhUser?: boolean
    bhxhPass?: boolean
    bhxhMaCSKCB?: boolean
    bhxhHoTenCB?: boolean
    bhxhCccdCB?: boolean
    hisHost?: boolean
    hisPort?: boolean
    hisUser?: boolean
    hisPass?: boolean
    hisDbName?: boolean
  }, ExtArgs["result"]["coSo"]>

  export type CoSoSelectScalar = {
    id?: boolean
    ten?: boolean
    diaChi?: boolean
    trangThai?: boolean
    sheetId?: boolean
    bhxhUser?: boolean
    bhxhPass?: boolean
    bhxhMaCSKCB?: boolean
    bhxhHoTenCB?: boolean
    bhxhCccdCB?: boolean
    hisHost?: boolean
    hisPort?: boolean
    hisUser?: boolean
    hisPass?: boolean
    hisDbName?: boolean
  }

  export type CoSoOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "ten" | "diaChi" | "trangThai" | "sheetId" | "bhxhUser" | "bhxhPass" | "bhxhMaCSKCB" | "bhxhHoTenCB" | "bhxhCccdCB" | "hisHost" | "hisPort" | "hisUser" | "hisPass" | "hisDbName", ExtArgs["result"]["coSo"]>
  export type CoSoInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    buoiKham?: boolean | CoSo$buoiKhamArgs<ExtArgs>
    nguoiDung?: boolean | CoSo$nguoiDungArgs<ExtArgs>
    hoSo?: boolean | CoSo$hoSoArgs<ExtArgs>
    _count?: boolean | CoSoCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type CoSoIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type CoSoIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $CoSoPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "CoSo"
    objects: {
      buoiKham: Prisma.$BuoiKhamPayload<ExtArgs>[]
      nguoiDung: Prisma.$NguoiDungCSRPayload<ExtArgs>[]
      hoSo: Prisma.$HoSoBenhNhanPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      ten: string
      diaChi: string | null
      trangThai: string
      sheetId: string | null
      bhxhUser: string | null
      bhxhPass: string | null
      bhxhMaCSKCB: string | null
      bhxhHoTenCB: string | null
      bhxhCccdCB: string | null
      hisHost: string | null
      hisPort: string | null
      hisUser: string | null
      hisPass: string | null
      hisDbName: string | null
    }, ExtArgs["result"]["coSo"]>
    composites: {}
  }

  type CoSoGetPayload<S extends boolean | null | undefined | CoSoDefaultArgs> = $Result.GetResult<Prisma.$CoSoPayload, S>

  type CoSoCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CoSoFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CoSoCountAggregateInputType | true
    }

  export interface CoSoDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['CoSo'], meta: { name: 'CoSo' } }
    /**
     * Find zero or one CoSo that matches the filter.
     * @param {CoSoFindUniqueArgs} args - Arguments to find a CoSo
     * @example
     * // Get one CoSo
     * const coSo = await prisma.coSo.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CoSoFindUniqueArgs>(args: SelectSubset<T, CoSoFindUniqueArgs<ExtArgs>>): Prisma__CoSoClient<$Result.GetResult<Prisma.$CoSoPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one CoSo that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CoSoFindUniqueOrThrowArgs} args - Arguments to find a CoSo
     * @example
     * // Get one CoSo
     * const coSo = await prisma.coSo.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CoSoFindUniqueOrThrowArgs>(args: SelectSubset<T, CoSoFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CoSoClient<$Result.GetResult<Prisma.$CoSoPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CoSo that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CoSoFindFirstArgs} args - Arguments to find a CoSo
     * @example
     * // Get one CoSo
     * const coSo = await prisma.coSo.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CoSoFindFirstArgs>(args?: SelectSubset<T, CoSoFindFirstArgs<ExtArgs>>): Prisma__CoSoClient<$Result.GetResult<Prisma.$CoSoPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CoSo that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CoSoFindFirstOrThrowArgs} args - Arguments to find a CoSo
     * @example
     * // Get one CoSo
     * const coSo = await prisma.coSo.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CoSoFindFirstOrThrowArgs>(args?: SelectSubset<T, CoSoFindFirstOrThrowArgs<ExtArgs>>): Prisma__CoSoClient<$Result.GetResult<Prisma.$CoSoPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more CoSos that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CoSoFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all CoSos
     * const coSos = await prisma.coSo.findMany()
     * 
     * // Get first 10 CoSos
     * const coSos = await prisma.coSo.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const coSoWithIdOnly = await prisma.coSo.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CoSoFindManyArgs>(args?: SelectSubset<T, CoSoFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CoSoPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a CoSo.
     * @param {CoSoCreateArgs} args - Arguments to create a CoSo.
     * @example
     * // Create one CoSo
     * const CoSo = await prisma.coSo.create({
     *   data: {
     *     // ... data to create a CoSo
     *   }
     * })
     * 
     */
    create<T extends CoSoCreateArgs>(args: SelectSubset<T, CoSoCreateArgs<ExtArgs>>): Prisma__CoSoClient<$Result.GetResult<Prisma.$CoSoPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many CoSos.
     * @param {CoSoCreateManyArgs} args - Arguments to create many CoSos.
     * @example
     * // Create many CoSos
     * const coSo = await prisma.coSo.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CoSoCreateManyArgs>(args?: SelectSubset<T, CoSoCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many CoSos and returns the data saved in the database.
     * @param {CoSoCreateManyAndReturnArgs} args - Arguments to create many CoSos.
     * @example
     * // Create many CoSos
     * const coSo = await prisma.coSo.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many CoSos and only return the `id`
     * const coSoWithIdOnly = await prisma.coSo.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CoSoCreateManyAndReturnArgs>(args?: SelectSubset<T, CoSoCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CoSoPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a CoSo.
     * @param {CoSoDeleteArgs} args - Arguments to delete one CoSo.
     * @example
     * // Delete one CoSo
     * const CoSo = await prisma.coSo.delete({
     *   where: {
     *     // ... filter to delete one CoSo
     *   }
     * })
     * 
     */
    delete<T extends CoSoDeleteArgs>(args: SelectSubset<T, CoSoDeleteArgs<ExtArgs>>): Prisma__CoSoClient<$Result.GetResult<Prisma.$CoSoPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one CoSo.
     * @param {CoSoUpdateArgs} args - Arguments to update one CoSo.
     * @example
     * // Update one CoSo
     * const coSo = await prisma.coSo.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CoSoUpdateArgs>(args: SelectSubset<T, CoSoUpdateArgs<ExtArgs>>): Prisma__CoSoClient<$Result.GetResult<Prisma.$CoSoPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more CoSos.
     * @param {CoSoDeleteManyArgs} args - Arguments to filter CoSos to delete.
     * @example
     * // Delete a few CoSos
     * const { count } = await prisma.coSo.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CoSoDeleteManyArgs>(args?: SelectSubset<T, CoSoDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CoSos.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CoSoUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many CoSos
     * const coSo = await prisma.coSo.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CoSoUpdateManyArgs>(args: SelectSubset<T, CoSoUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CoSos and returns the data updated in the database.
     * @param {CoSoUpdateManyAndReturnArgs} args - Arguments to update many CoSos.
     * @example
     * // Update many CoSos
     * const coSo = await prisma.coSo.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more CoSos and only return the `id`
     * const coSoWithIdOnly = await prisma.coSo.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends CoSoUpdateManyAndReturnArgs>(args: SelectSubset<T, CoSoUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CoSoPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one CoSo.
     * @param {CoSoUpsertArgs} args - Arguments to update or create a CoSo.
     * @example
     * // Update or create a CoSo
     * const coSo = await prisma.coSo.upsert({
     *   create: {
     *     // ... data to create a CoSo
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the CoSo we want to update
     *   }
     * })
     */
    upsert<T extends CoSoUpsertArgs>(args: SelectSubset<T, CoSoUpsertArgs<ExtArgs>>): Prisma__CoSoClient<$Result.GetResult<Prisma.$CoSoPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of CoSos.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CoSoCountArgs} args - Arguments to filter CoSos to count.
     * @example
     * // Count the number of CoSos
     * const count = await prisma.coSo.count({
     *   where: {
     *     // ... the filter for the CoSos we want to count
     *   }
     * })
    **/
    count<T extends CoSoCountArgs>(
      args?: Subset<T, CoSoCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CoSoCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a CoSo.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CoSoAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CoSoAggregateArgs>(args: Subset<T, CoSoAggregateArgs>): Prisma.PrismaPromise<GetCoSoAggregateType<T>>

    /**
     * Group by CoSo.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CoSoGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CoSoGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CoSoGroupByArgs['orderBy'] }
        : { orderBy?: CoSoGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CoSoGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCoSoGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the CoSo model
   */
  readonly fields: CoSoFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for CoSo.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CoSoClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    buoiKham<T extends CoSo$buoiKhamArgs<ExtArgs> = {}>(args?: Subset<T, CoSo$buoiKhamArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BuoiKhamPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    nguoiDung<T extends CoSo$nguoiDungArgs<ExtArgs> = {}>(args?: Subset<T, CoSo$nguoiDungArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NguoiDungCSRPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    hoSo<T extends CoSo$hoSoArgs<ExtArgs> = {}>(args?: Subset<T, CoSo$hoSoArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$HoSoBenhNhanPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the CoSo model
   */
  interface CoSoFieldRefs {
    readonly id: FieldRef<"CoSo", 'String'>
    readonly ten: FieldRef<"CoSo", 'String'>
    readonly diaChi: FieldRef<"CoSo", 'String'>
    readonly trangThai: FieldRef<"CoSo", 'String'>
    readonly sheetId: FieldRef<"CoSo", 'String'>
    readonly bhxhUser: FieldRef<"CoSo", 'String'>
    readonly bhxhPass: FieldRef<"CoSo", 'String'>
    readonly bhxhMaCSKCB: FieldRef<"CoSo", 'String'>
    readonly bhxhHoTenCB: FieldRef<"CoSo", 'String'>
    readonly bhxhCccdCB: FieldRef<"CoSo", 'String'>
    readonly hisHost: FieldRef<"CoSo", 'String'>
    readonly hisPort: FieldRef<"CoSo", 'String'>
    readonly hisUser: FieldRef<"CoSo", 'String'>
    readonly hisPass: FieldRef<"CoSo", 'String'>
    readonly hisDbName: FieldRef<"CoSo", 'String'>
  }
    

  // Custom InputTypes
  /**
   * CoSo findUnique
   */
  export type CoSoFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CoSo
     */
    select?: CoSoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CoSo
     */
    omit?: CoSoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CoSoInclude<ExtArgs> | null
    /**
     * Filter, which CoSo to fetch.
     */
    where: CoSoWhereUniqueInput
  }

  /**
   * CoSo findUniqueOrThrow
   */
  export type CoSoFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CoSo
     */
    select?: CoSoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CoSo
     */
    omit?: CoSoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CoSoInclude<ExtArgs> | null
    /**
     * Filter, which CoSo to fetch.
     */
    where: CoSoWhereUniqueInput
  }

  /**
   * CoSo findFirst
   */
  export type CoSoFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CoSo
     */
    select?: CoSoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CoSo
     */
    omit?: CoSoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CoSoInclude<ExtArgs> | null
    /**
     * Filter, which CoSo to fetch.
     */
    where?: CoSoWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CoSos to fetch.
     */
    orderBy?: CoSoOrderByWithRelationInput | CoSoOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CoSos.
     */
    cursor?: CoSoWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CoSos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CoSos.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CoSos.
     */
    distinct?: CoSoScalarFieldEnum | CoSoScalarFieldEnum[]
  }

  /**
   * CoSo findFirstOrThrow
   */
  export type CoSoFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CoSo
     */
    select?: CoSoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CoSo
     */
    omit?: CoSoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CoSoInclude<ExtArgs> | null
    /**
     * Filter, which CoSo to fetch.
     */
    where?: CoSoWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CoSos to fetch.
     */
    orderBy?: CoSoOrderByWithRelationInput | CoSoOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CoSos.
     */
    cursor?: CoSoWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CoSos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CoSos.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CoSos.
     */
    distinct?: CoSoScalarFieldEnum | CoSoScalarFieldEnum[]
  }

  /**
   * CoSo findMany
   */
  export type CoSoFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CoSo
     */
    select?: CoSoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CoSo
     */
    omit?: CoSoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CoSoInclude<ExtArgs> | null
    /**
     * Filter, which CoSos to fetch.
     */
    where?: CoSoWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CoSos to fetch.
     */
    orderBy?: CoSoOrderByWithRelationInput | CoSoOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing CoSos.
     */
    cursor?: CoSoWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CoSos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CoSos.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CoSos.
     */
    distinct?: CoSoScalarFieldEnum | CoSoScalarFieldEnum[]
  }

  /**
   * CoSo create
   */
  export type CoSoCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CoSo
     */
    select?: CoSoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CoSo
     */
    omit?: CoSoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CoSoInclude<ExtArgs> | null
    /**
     * The data needed to create a CoSo.
     */
    data: XOR<CoSoCreateInput, CoSoUncheckedCreateInput>
  }

  /**
   * CoSo createMany
   */
  export type CoSoCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many CoSos.
     */
    data: CoSoCreateManyInput | CoSoCreateManyInput[]
  }

  /**
   * CoSo createManyAndReturn
   */
  export type CoSoCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CoSo
     */
    select?: CoSoSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CoSo
     */
    omit?: CoSoOmit<ExtArgs> | null
    /**
     * The data used to create many CoSos.
     */
    data: CoSoCreateManyInput | CoSoCreateManyInput[]
  }

  /**
   * CoSo update
   */
  export type CoSoUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CoSo
     */
    select?: CoSoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CoSo
     */
    omit?: CoSoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CoSoInclude<ExtArgs> | null
    /**
     * The data needed to update a CoSo.
     */
    data: XOR<CoSoUpdateInput, CoSoUncheckedUpdateInput>
    /**
     * Choose, which CoSo to update.
     */
    where: CoSoWhereUniqueInput
  }

  /**
   * CoSo updateMany
   */
  export type CoSoUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update CoSos.
     */
    data: XOR<CoSoUpdateManyMutationInput, CoSoUncheckedUpdateManyInput>
    /**
     * Filter which CoSos to update
     */
    where?: CoSoWhereInput
    /**
     * Limit how many CoSos to update.
     */
    limit?: number
  }

  /**
   * CoSo updateManyAndReturn
   */
  export type CoSoUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CoSo
     */
    select?: CoSoSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CoSo
     */
    omit?: CoSoOmit<ExtArgs> | null
    /**
     * The data used to update CoSos.
     */
    data: XOR<CoSoUpdateManyMutationInput, CoSoUncheckedUpdateManyInput>
    /**
     * Filter which CoSos to update
     */
    where?: CoSoWhereInput
    /**
     * Limit how many CoSos to update.
     */
    limit?: number
  }

  /**
   * CoSo upsert
   */
  export type CoSoUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CoSo
     */
    select?: CoSoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CoSo
     */
    omit?: CoSoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CoSoInclude<ExtArgs> | null
    /**
     * The filter to search for the CoSo to update in case it exists.
     */
    where: CoSoWhereUniqueInput
    /**
     * In case the CoSo found by the `where` argument doesn't exist, create a new CoSo with this data.
     */
    create: XOR<CoSoCreateInput, CoSoUncheckedCreateInput>
    /**
     * In case the CoSo was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CoSoUpdateInput, CoSoUncheckedUpdateInput>
  }

  /**
   * CoSo delete
   */
  export type CoSoDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CoSo
     */
    select?: CoSoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CoSo
     */
    omit?: CoSoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CoSoInclude<ExtArgs> | null
    /**
     * Filter which CoSo to delete.
     */
    where: CoSoWhereUniqueInput
  }

  /**
   * CoSo deleteMany
   */
  export type CoSoDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CoSos to delete
     */
    where?: CoSoWhereInput
    /**
     * Limit how many CoSos to delete.
     */
    limit?: number
  }

  /**
   * CoSo.buoiKham
   */
  export type CoSo$buoiKhamArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BuoiKham
     */
    select?: BuoiKhamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BuoiKham
     */
    omit?: BuoiKhamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BuoiKhamInclude<ExtArgs> | null
    where?: BuoiKhamWhereInput
    orderBy?: BuoiKhamOrderByWithRelationInput | BuoiKhamOrderByWithRelationInput[]
    cursor?: BuoiKhamWhereUniqueInput
    take?: number
    skip?: number
    distinct?: BuoiKhamScalarFieldEnum | BuoiKhamScalarFieldEnum[]
  }

  /**
   * CoSo.nguoiDung
   */
  export type CoSo$nguoiDungArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NguoiDungCSR
     */
    select?: NguoiDungCSRSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NguoiDungCSR
     */
    omit?: NguoiDungCSROmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NguoiDungCSRInclude<ExtArgs> | null
    where?: NguoiDungCSRWhereInput
    orderBy?: NguoiDungCSROrderByWithRelationInput | NguoiDungCSROrderByWithRelationInput[]
    cursor?: NguoiDungCSRWhereUniqueInput
    take?: number
    skip?: number
    distinct?: NguoiDungCSRScalarFieldEnum | NguoiDungCSRScalarFieldEnum[]
  }

  /**
   * CoSo.hoSo
   */
  export type CoSo$hoSoArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HoSoBenhNhan
     */
    select?: HoSoBenhNhanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the HoSoBenhNhan
     */
    omit?: HoSoBenhNhanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HoSoBenhNhanInclude<ExtArgs> | null
    where?: HoSoBenhNhanWhereInput
    orderBy?: HoSoBenhNhanOrderByWithRelationInput | HoSoBenhNhanOrderByWithRelationInput[]
    cursor?: HoSoBenhNhanWhereUniqueInput
    take?: number
    skip?: number
    distinct?: HoSoBenhNhanScalarFieldEnum | HoSoBenhNhanScalarFieldEnum[]
  }

  /**
   * CoSo without action
   */
  export type CoSoDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CoSo
     */
    select?: CoSoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CoSo
     */
    omit?: CoSoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CoSoInclude<ExtArgs> | null
  }


  /**
   * Model NguoiDungCSR
   */

  export type AggregateNguoiDungCSR = {
    _count: NguoiDungCSRCountAggregateOutputType | null
    _min: NguoiDungCSRMinAggregateOutputType | null
    _max: NguoiDungCSRMaxAggregateOutputType | null
  }

  export type NguoiDungCSRMinAggregateOutputType = {
    maNV: string | null
    hoTen: string | null
    vaiTro: string | null
    coSoId: string | null
    tenDangNhap: string | null
    matKhauHash: string | null
    trangThai: string | null
  }

  export type NguoiDungCSRMaxAggregateOutputType = {
    maNV: string | null
    hoTen: string | null
    vaiTro: string | null
    coSoId: string | null
    tenDangNhap: string | null
    matKhauHash: string | null
    trangThai: string | null
  }

  export type NguoiDungCSRCountAggregateOutputType = {
    maNV: number
    hoTen: number
    vaiTro: number
    coSoId: number
    tenDangNhap: number
    matKhauHash: number
    trangThai: number
    _all: number
  }


  export type NguoiDungCSRMinAggregateInputType = {
    maNV?: true
    hoTen?: true
    vaiTro?: true
    coSoId?: true
    tenDangNhap?: true
    matKhauHash?: true
    trangThai?: true
  }

  export type NguoiDungCSRMaxAggregateInputType = {
    maNV?: true
    hoTen?: true
    vaiTro?: true
    coSoId?: true
    tenDangNhap?: true
    matKhauHash?: true
    trangThai?: true
  }

  export type NguoiDungCSRCountAggregateInputType = {
    maNV?: true
    hoTen?: true
    vaiTro?: true
    coSoId?: true
    tenDangNhap?: true
    matKhauHash?: true
    trangThai?: true
    _all?: true
  }

  export type NguoiDungCSRAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which NguoiDungCSR to aggregate.
     */
    where?: NguoiDungCSRWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of NguoiDungCSRS to fetch.
     */
    orderBy?: NguoiDungCSROrderByWithRelationInput | NguoiDungCSROrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: NguoiDungCSRWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` NguoiDungCSRS from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` NguoiDungCSRS.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned NguoiDungCSRS
    **/
    _count?: true | NguoiDungCSRCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: NguoiDungCSRMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: NguoiDungCSRMaxAggregateInputType
  }

  export type GetNguoiDungCSRAggregateType<T extends NguoiDungCSRAggregateArgs> = {
        [P in keyof T & keyof AggregateNguoiDungCSR]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateNguoiDungCSR[P]>
      : GetScalarType<T[P], AggregateNguoiDungCSR[P]>
  }




  export type NguoiDungCSRGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: NguoiDungCSRWhereInput
    orderBy?: NguoiDungCSROrderByWithAggregationInput | NguoiDungCSROrderByWithAggregationInput[]
    by: NguoiDungCSRScalarFieldEnum[] | NguoiDungCSRScalarFieldEnum
    having?: NguoiDungCSRScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: NguoiDungCSRCountAggregateInputType | true
    _min?: NguoiDungCSRMinAggregateInputType
    _max?: NguoiDungCSRMaxAggregateInputType
  }

  export type NguoiDungCSRGroupByOutputType = {
    maNV: string
    hoTen: string
    vaiTro: string
    coSoId: string | null
    tenDangNhap: string
    matKhauHash: string
    trangThai: string
    _count: NguoiDungCSRCountAggregateOutputType | null
    _min: NguoiDungCSRMinAggregateOutputType | null
    _max: NguoiDungCSRMaxAggregateOutputType | null
  }

  type GetNguoiDungCSRGroupByPayload<T extends NguoiDungCSRGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<NguoiDungCSRGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof NguoiDungCSRGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], NguoiDungCSRGroupByOutputType[P]>
            : GetScalarType<T[P], NguoiDungCSRGroupByOutputType[P]>
        }
      >
    >


  export type NguoiDungCSRSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    maNV?: boolean
    hoTen?: boolean
    vaiTro?: boolean
    coSoId?: boolean
    tenDangNhap?: boolean
    matKhauHash?: boolean
    trangThai?: boolean
    coSo?: boolean | NguoiDungCSR$coSoArgs<ExtArgs>
    buoiKhamTao?: boolean | NguoiDungCSR$buoiKhamTaoArgs<ExtArgs>
    hoSoTuVan?: boolean | NguoiDungCSR$hoSoTuVanArgs<ExtArgs>
    hoSoPhuTrach?: boolean | NguoiDungCSR$hoSoPhuTrachArgs<ExtArgs>
    hoSoChotCuoi?: boolean | NguoiDungCSR$hoSoChotCuoiArgs<ExtArgs>
    nhatKy?: boolean | NguoiDungCSR$nhatKyArgs<ExtArgs>
    _count?: boolean | NguoiDungCSRCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["nguoiDungCSR"]>

  export type NguoiDungCSRSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    maNV?: boolean
    hoTen?: boolean
    vaiTro?: boolean
    coSoId?: boolean
    tenDangNhap?: boolean
    matKhauHash?: boolean
    trangThai?: boolean
    coSo?: boolean | NguoiDungCSR$coSoArgs<ExtArgs>
  }, ExtArgs["result"]["nguoiDungCSR"]>

  export type NguoiDungCSRSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    maNV?: boolean
    hoTen?: boolean
    vaiTro?: boolean
    coSoId?: boolean
    tenDangNhap?: boolean
    matKhauHash?: boolean
    trangThai?: boolean
    coSo?: boolean | NguoiDungCSR$coSoArgs<ExtArgs>
  }, ExtArgs["result"]["nguoiDungCSR"]>

  export type NguoiDungCSRSelectScalar = {
    maNV?: boolean
    hoTen?: boolean
    vaiTro?: boolean
    coSoId?: boolean
    tenDangNhap?: boolean
    matKhauHash?: boolean
    trangThai?: boolean
  }

  export type NguoiDungCSROmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"maNV" | "hoTen" | "vaiTro" | "coSoId" | "tenDangNhap" | "matKhauHash" | "trangThai", ExtArgs["result"]["nguoiDungCSR"]>
  export type NguoiDungCSRInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    coSo?: boolean | NguoiDungCSR$coSoArgs<ExtArgs>
    buoiKhamTao?: boolean | NguoiDungCSR$buoiKhamTaoArgs<ExtArgs>
    hoSoTuVan?: boolean | NguoiDungCSR$hoSoTuVanArgs<ExtArgs>
    hoSoPhuTrach?: boolean | NguoiDungCSR$hoSoPhuTrachArgs<ExtArgs>
    hoSoChotCuoi?: boolean | NguoiDungCSR$hoSoChotCuoiArgs<ExtArgs>
    nhatKy?: boolean | NguoiDungCSR$nhatKyArgs<ExtArgs>
    _count?: boolean | NguoiDungCSRCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type NguoiDungCSRIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    coSo?: boolean | NguoiDungCSR$coSoArgs<ExtArgs>
  }
  export type NguoiDungCSRIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    coSo?: boolean | NguoiDungCSR$coSoArgs<ExtArgs>
  }

  export type $NguoiDungCSRPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "NguoiDungCSR"
    objects: {
      coSo: Prisma.$CoSoPayload<ExtArgs> | null
      buoiKhamTao: Prisma.$BuoiKhamPayload<ExtArgs>[]
      hoSoTuVan: Prisma.$HoSoBenhNhanPayload<ExtArgs>[]
      hoSoPhuTrach: Prisma.$HoSoBenhNhanPayload<ExtArgs>[]
      hoSoChotCuoi: Prisma.$HoSoBenhNhanPayload<ExtArgs>[]
      nhatKy: Prisma.$NhatKyTheoDoiPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      maNV: string
      hoTen: string
      vaiTro: string
      coSoId: string | null
      tenDangNhap: string
      matKhauHash: string
      trangThai: string
    }, ExtArgs["result"]["nguoiDungCSR"]>
    composites: {}
  }

  type NguoiDungCSRGetPayload<S extends boolean | null | undefined | NguoiDungCSRDefaultArgs> = $Result.GetResult<Prisma.$NguoiDungCSRPayload, S>

  type NguoiDungCSRCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<NguoiDungCSRFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: NguoiDungCSRCountAggregateInputType | true
    }

  export interface NguoiDungCSRDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['NguoiDungCSR'], meta: { name: 'NguoiDungCSR' } }
    /**
     * Find zero or one NguoiDungCSR that matches the filter.
     * @param {NguoiDungCSRFindUniqueArgs} args - Arguments to find a NguoiDungCSR
     * @example
     * // Get one NguoiDungCSR
     * const nguoiDungCSR = await prisma.nguoiDungCSR.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends NguoiDungCSRFindUniqueArgs>(args: SelectSubset<T, NguoiDungCSRFindUniqueArgs<ExtArgs>>): Prisma__NguoiDungCSRClient<$Result.GetResult<Prisma.$NguoiDungCSRPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one NguoiDungCSR that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {NguoiDungCSRFindUniqueOrThrowArgs} args - Arguments to find a NguoiDungCSR
     * @example
     * // Get one NguoiDungCSR
     * const nguoiDungCSR = await prisma.nguoiDungCSR.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends NguoiDungCSRFindUniqueOrThrowArgs>(args: SelectSubset<T, NguoiDungCSRFindUniqueOrThrowArgs<ExtArgs>>): Prisma__NguoiDungCSRClient<$Result.GetResult<Prisma.$NguoiDungCSRPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first NguoiDungCSR that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NguoiDungCSRFindFirstArgs} args - Arguments to find a NguoiDungCSR
     * @example
     * // Get one NguoiDungCSR
     * const nguoiDungCSR = await prisma.nguoiDungCSR.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends NguoiDungCSRFindFirstArgs>(args?: SelectSubset<T, NguoiDungCSRFindFirstArgs<ExtArgs>>): Prisma__NguoiDungCSRClient<$Result.GetResult<Prisma.$NguoiDungCSRPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first NguoiDungCSR that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NguoiDungCSRFindFirstOrThrowArgs} args - Arguments to find a NguoiDungCSR
     * @example
     * // Get one NguoiDungCSR
     * const nguoiDungCSR = await prisma.nguoiDungCSR.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends NguoiDungCSRFindFirstOrThrowArgs>(args?: SelectSubset<T, NguoiDungCSRFindFirstOrThrowArgs<ExtArgs>>): Prisma__NguoiDungCSRClient<$Result.GetResult<Prisma.$NguoiDungCSRPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more NguoiDungCSRS that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NguoiDungCSRFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all NguoiDungCSRS
     * const nguoiDungCSRS = await prisma.nguoiDungCSR.findMany()
     * 
     * // Get first 10 NguoiDungCSRS
     * const nguoiDungCSRS = await prisma.nguoiDungCSR.findMany({ take: 10 })
     * 
     * // Only select the `maNV`
     * const nguoiDungCSRWithMaNVOnly = await prisma.nguoiDungCSR.findMany({ select: { maNV: true } })
     * 
     */
    findMany<T extends NguoiDungCSRFindManyArgs>(args?: SelectSubset<T, NguoiDungCSRFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NguoiDungCSRPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a NguoiDungCSR.
     * @param {NguoiDungCSRCreateArgs} args - Arguments to create a NguoiDungCSR.
     * @example
     * // Create one NguoiDungCSR
     * const NguoiDungCSR = await prisma.nguoiDungCSR.create({
     *   data: {
     *     // ... data to create a NguoiDungCSR
     *   }
     * })
     * 
     */
    create<T extends NguoiDungCSRCreateArgs>(args: SelectSubset<T, NguoiDungCSRCreateArgs<ExtArgs>>): Prisma__NguoiDungCSRClient<$Result.GetResult<Prisma.$NguoiDungCSRPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many NguoiDungCSRS.
     * @param {NguoiDungCSRCreateManyArgs} args - Arguments to create many NguoiDungCSRS.
     * @example
     * // Create many NguoiDungCSRS
     * const nguoiDungCSR = await prisma.nguoiDungCSR.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends NguoiDungCSRCreateManyArgs>(args?: SelectSubset<T, NguoiDungCSRCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many NguoiDungCSRS and returns the data saved in the database.
     * @param {NguoiDungCSRCreateManyAndReturnArgs} args - Arguments to create many NguoiDungCSRS.
     * @example
     * // Create many NguoiDungCSRS
     * const nguoiDungCSR = await prisma.nguoiDungCSR.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many NguoiDungCSRS and only return the `maNV`
     * const nguoiDungCSRWithMaNVOnly = await prisma.nguoiDungCSR.createManyAndReturn({
     *   select: { maNV: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends NguoiDungCSRCreateManyAndReturnArgs>(args?: SelectSubset<T, NguoiDungCSRCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NguoiDungCSRPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a NguoiDungCSR.
     * @param {NguoiDungCSRDeleteArgs} args - Arguments to delete one NguoiDungCSR.
     * @example
     * // Delete one NguoiDungCSR
     * const NguoiDungCSR = await prisma.nguoiDungCSR.delete({
     *   where: {
     *     // ... filter to delete one NguoiDungCSR
     *   }
     * })
     * 
     */
    delete<T extends NguoiDungCSRDeleteArgs>(args: SelectSubset<T, NguoiDungCSRDeleteArgs<ExtArgs>>): Prisma__NguoiDungCSRClient<$Result.GetResult<Prisma.$NguoiDungCSRPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one NguoiDungCSR.
     * @param {NguoiDungCSRUpdateArgs} args - Arguments to update one NguoiDungCSR.
     * @example
     * // Update one NguoiDungCSR
     * const nguoiDungCSR = await prisma.nguoiDungCSR.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends NguoiDungCSRUpdateArgs>(args: SelectSubset<T, NguoiDungCSRUpdateArgs<ExtArgs>>): Prisma__NguoiDungCSRClient<$Result.GetResult<Prisma.$NguoiDungCSRPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more NguoiDungCSRS.
     * @param {NguoiDungCSRDeleteManyArgs} args - Arguments to filter NguoiDungCSRS to delete.
     * @example
     * // Delete a few NguoiDungCSRS
     * const { count } = await prisma.nguoiDungCSR.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends NguoiDungCSRDeleteManyArgs>(args?: SelectSubset<T, NguoiDungCSRDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more NguoiDungCSRS.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NguoiDungCSRUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many NguoiDungCSRS
     * const nguoiDungCSR = await prisma.nguoiDungCSR.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends NguoiDungCSRUpdateManyArgs>(args: SelectSubset<T, NguoiDungCSRUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more NguoiDungCSRS and returns the data updated in the database.
     * @param {NguoiDungCSRUpdateManyAndReturnArgs} args - Arguments to update many NguoiDungCSRS.
     * @example
     * // Update many NguoiDungCSRS
     * const nguoiDungCSR = await prisma.nguoiDungCSR.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more NguoiDungCSRS and only return the `maNV`
     * const nguoiDungCSRWithMaNVOnly = await prisma.nguoiDungCSR.updateManyAndReturn({
     *   select: { maNV: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends NguoiDungCSRUpdateManyAndReturnArgs>(args: SelectSubset<T, NguoiDungCSRUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NguoiDungCSRPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one NguoiDungCSR.
     * @param {NguoiDungCSRUpsertArgs} args - Arguments to update or create a NguoiDungCSR.
     * @example
     * // Update or create a NguoiDungCSR
     * const nguoiDungCSR = await prisma.nguoiDungCSR.upsert({
     *   create: {
     *     // ... data to create a NguoiDungCSR
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the NguoiDungCSR we want to update
     *   }
     * })
     */
    upsert<T extends NguoiDungCSRUpsertArgs>(args: SelectSubset<T, NguoiDungCSRUpsertArgs<ExtArgs>>): Prisma__NguoiDungCSRClient<$Result.GetResult<Prisma.$NguoiDungCSRPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of NguoiDungCSRS.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NguoiDungCSRCountArgs} args - Arguments to filter NguoiDungCSRS to count.
     * @example
     * // Count the number of NguoiDungCSRS
     * const count = await prisma.nguoiDungCSR.count({
     *   where: {
     *     // ... the filter for the NguoiDungCSRS we want to count
     *   }
     * })
    **/
    count<T extends NguoiDungCSRCountArgs>(
      args?: Subset<T, NguoiDungCSRCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], NguoiDungCSRCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a NguoiDungCSR.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NguoiDungCSRAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends NguoiDungCSRAggregateArgs>(args: Subset<T, NguoiDungCSRAggregateArgs>): Prisma.PrismaPromise<GetNguoiDungCSRAggregateType<T>>

    /**
     * Group by NguoiDungCSR.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NguoiDungCSRGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends NguoiDungCSRGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: NguoiDungCSRGroupByArgs['orderBy'] }
        : { orderBy?: NguoiDungCSRGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, NguoiDungCSRGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetNguoiDungCSRGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the NguoiDungCSR model
   */
  readonly fields: NguoiDungCSRFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for NguoiDungCSR.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__NguoiDungCSRClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    coSo<T extends NguoiDungCSR$coSoArgs<ExtArgs> = {}>(args?: Subset<T, NguoiDungCSR$coSoArgs<ExtArgs>>): Prisma__CoSoClient<$Result.GetResult<Prisma.$CoSoPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    buoiKhamTao<T extends NguoiDungCSR$buoiKhamTaoArgs<ExtArgs> = {}>(args?: Subset<T, NguoiDungCSR$buoiKhamTaoArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BuoiKhamPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    hoSoTuVan<T extends NguoiDungCSR$hoSoTuVanArgs<ExtArgs> = {}>(args?: Subset<T, NguoiDungCSR$hoSoTuVanArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$HoSoBenhNhanPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    hoSoPhuTrach<T extends NguoiDungCSR$hoSoPhuTrachArgs<ExtArgs> = {}>(args?: Subset<T, NguoiDungCSR$hoSoPhuTrachArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$HoSoBenhNhanPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    hoSoChotCuoi<T extends NguoiDungCSR$hoSoChotCuoiArgs<ExtArgs> = {}>(args?: Subset<T, NguoiDungCSR$hoSoChotCuoiArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$HoSoBenhNhanPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    nhatKy<T extends NguoiDungCSR$nhatKyArgs<ExtArgs> = {}>(args?: Subset<T, NguoiDungCSR$nhatKyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NhatKyTheoDoiPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the NguoiDungCSR model
   */
  interface NguoiDungCSRFieldRefs {
    readonly maNV: FieldRef<"NguoiDungCSR", 'String'>
    readonly hoTen: FieldRef<"NguoiDungCSR", 'String'>
    readonly vaiTro: FieldRef<"NguoiDungCSR", 'String'>
    readonly coSoId: FieldRef<"NguoiDungCSR", 'String'>
    readonly tenDangNhap: FieldRef<"NguoiDungCSR", 'String'>
    readonly matKhauHash: FieldRef<"NguoiDungCSR", 'String'>
    readonly trangThai: FieldRef<"NguoiDungCSR", 'String'>
  }
    

  // Custom InputTypes
  /**
   * NguoiDungCSR findUnique
   */
  export type NguoiDungCSRFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NguoiDungCSR
     */
    select?: NguoiDungCSRSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NguoiDungCSR
     */
    omit?: NguoiDungCSROmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NguoiDungCSRInclude<ExtArgs> | null
    /**
     * Filter, which NguoiDungCSR to fetch.
     */
    where: NguoiDungCSRWhereUniqueInput
  }

  /**
   * NguoiDungCSR findUniqueOrThrow
   */
  export type NguoiDungCSRFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NguoiDungCSR
     */
    select?: NguoiDungCSRSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NguoiDungCSR
     */
    omit?: NguoiDungCSROmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NguoiDungCSRInclude<ExtArgs> | null
    /**
     * Filter, which NguoiDungCSR to fetch.
     */
    where: NguoiDungCSRWhereUniqueInput
  }

  /**
   * NguoiDungCSR findFirst
   */
  export type NguoiDungCSRFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NguoiDungCSR
     */
    select?: NguoiDungCSRSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NguoiDungCSR
     */
    omit?: NguoiDungCSROmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NguoiDungCSRInclude<ExtArgs> | null
    /**
     * Filter, which NguoiDungCSR to fetch.
     */
    where?: NguoiDungCSRWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of NguoiDungCSRS to fetch.
     */
    orderBy?: NguoiDungCSROrderByWithRelationInput | NguoiDungCSROrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for NguoiDungCSRS.
     */
    cursor?: NguoiDungCSRWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` NguoiDungCSRS from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` NguoiDungCSRS.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of NguoiDungCSRS.
     */
    distinct?: NguoiDungCSRScalarFieldEnum | NguoiDungCSRScalarFieldEnum[]
  }

  /**
   * NguoiDungCSR findFirstOrThrow
   */
  export type NguoiDungCSRFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NguoiDungCSR
     */
    select?: NguoiDungCSRSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NguoiDungCSR
     */
    omit?: NguoiDungCSROmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NguoiDungCSRInclude<ExtArgs> | null
    /**
     * Filter, which NguoiDungCSR to fetch.
     */
    where?: NguoiDungCSRWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of NguoiDungCSRS to fetch.
     */
    orderBy?: NguoiDungCSROrderByWithRelationInput | NguoiDungCSROrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for NguoiDungCSRS.
     */
    cursor?: NguoiDungCSRWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` NguoiDungCSRS from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` NguoiDungCSRS.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of NguoiDungCSRS.
     */
    distinct?: NguoiDungCSRScalarFieldEnum | NguoiDungCSRScalarFieldEnum[]
  }

  /**
   * NguoiDungCSR findMany
   */
  export type NguoiDungCSRFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NguoiDungCSR
     */
    select?: NguoiDungCSRSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NguoiDungCSR
     */
    omit?: NguoiDungCSROmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NguoiDungCSRInclude<ExtArgs> | null
    /**
     * Filter, which NguoiDungCSRS to fetch.
     */
    where?: NguoiDungCSRWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of NguoiDungCSRS to fetch.
     */
    orderBy?: NguoiDungCSROrderByWithRelationInput | NguoiDungCSROrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing NguoiDungCSRS.
     */
    cursor?: NguoiDungCSRWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` NguoiDungCSRS from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` NguoiDungCSRS.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of NguoiDungCSRS.
     */
    distinct?: NguoiDungCSRScalarFieldEnum | NguoiDungCSRScalarFieldEnum[]
  }

  /**
   * NguoiDungCSR create
   */
  export type NguoiDungCSRCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NguoiDungCSR
     */
    select?: NguoiDungCSRSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NguoiDungCSR
     */
    omit?: NguoiDungCSROmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NguoiDungCSRInclude<ExtArgs> | null
    /**
     * The data needed to create a NguoiDungCSR.
     */
    data: XOR<NguoiDungCSRCreateInput, NguoiDungCSRUncheckedCreateInput>
  }

  /**
   * NguoiDungCSR createMany
   */
  export type NguoiDungCSRCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many NguoiDungCSRS.
     */
    data: NguoiDungCSRCreateManyInput | NguoiDungCSRCreateManyInput[]
  }

  /**
   * NguoiDungCSR createManyAndReturn
   */
  export type NguoiDungCSRCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NguoiDungCSR
     */
    select?: NguoiDungCSRSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the NguoiDungCSR
     */
    omit?: NguoiDungCSROmit<ExtArgs> | null
    /**
     * The data used to create many NguoiDungCSRS.
     */
    data: NguoiDungCSRCreateManyInput | NguoiDungCSRCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NguoiDungCSRIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * NguoiDungCSR update
   */
  export type NguoiDungCSRUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NguoiDungCSR
     */
    select?: NguoiDungCSRSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NguoiDungCSR
     */
    omit?: NguoiDungCSROmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NguoiDungCSRInclude<ExtArgs> | null
    /**
     * The data needed to update a NguoiDungCSR.
     */
    data: XOR<NguoiDungCSRUpdateInput, NguoiDungCSRUncheckedUpdateInput>
    /**
     * Choose, which NguoiDungCSR to update.
     */
    where: NguoiDungCSRWhereUniqueInput
  }

  /**
   * NguoiDungCSR updateMany
   */
  export type NguoiDungCSRUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update NguoiDungCSRS.
     */
    data: XOR<NguoiDungCSRUpdateManyMutationInput, NguoiDungCSRUncheckedUpdateManyInput>
    /**
     * Filter which NguoiDungCSRS to update
     */
    where?: NguoiDungCSRWhereInput
    /**
     * Limit how many NguoiDungCSRS to update.
     */
    limit?: number
  }

  /**
   * NguoiDungCSR updateManyAndReturn
   */
  export type NguoiDungCSRUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NguoiDungCSR
     */
    select?: NguoiDungCSRSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the NguoiDungCSR
     */
    omit?: NguoiDungCSROmit<ExtArgs> | null
    /**
     * The data used to update NguoiDungCSRS.
     */
    data: XOR<NguoiDungCSRUpdateManyMutationInput, NguoiDungCSRUncheckedUpdateManyInput>
    /**
     * Filter which NguoiDungCSRS to update
     */
    where?: NguoiDungCSRWhereInput
    /**
     * Limit how many NguoiDungCSRS to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NguoiDungCSRIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * NguoiDungCSR upsert
   */
  export type NguoiDungCSRUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NguoiDungCSR
     */
    select?: NguoiDungCSRSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NguoiDungCSR
     */
    omit?: NguoiDungCSROmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NguoiDungCSRInclude<ExtArgs> | null
    /**
     * The filter to search for the NguoiDungCSR to update in case it exists.
     */
    where: NguoiDungCSRWhereUniqueInput
    /**
     * In case the NguoiDungCSR found by the `where` argument doesn't exist, create a new NguoiDungCSR with this data.
     */
    create: XOR<NguoiDungCSRCreateInput, NguoiDungCSRUncheckedCreateInput>
    /**
     * In case the NguoiDungCSR was found with the provided `where` argument, update it with this data.
     */
    update: XOR<NguoiDungCSRUpdateInput, NguoiDungCSRUncheckedUpdateInput>
  }

  /**
   * NguoiDungCSR delete
   */
  export type NguoiDungCSRDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NguoiDungCSR
     */
    select?: NguoiDungCSRSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NguoiDungCSR
     */
    omit?: NguoiDungCSROmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NguoiDungCSRInclude<ExtArgs> | null
    /**
     * Filter which NguoiDungCSR to delete.
     */
    where: NguoiDungCSRWhereUniqueInput
  }

  /**
   * NguoiDungCSR deleteMany
   */
  export type NguoiDungCSRDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which NguoiDungCSRS to delete
     */
    where?: NguoiDungCSRWhereInput
    /**
     * Limit how many NguoiDungCSRS to delete.
     */
    limit?: number
  }

  /**
   * NguoiDungCSR.coSo
   */
  export type NguoiDungCSR$coSoArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CoSo
     */
    select?: CoSoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CoSo
     */
    omit?: CoSoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CoSoInclude<ExtArgs> | null
    where?: CoSoWhereInput
  }

  /**
   * NguoiDungCSR.buoiKhamTao
   */
  export type NguoiDungCSR$buoiKhamTaoArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BuoiKham
     */
    select?: BuoiKhamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BuoiKham
     */
    omit?: BuoiKhamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BuoiKhamInclude<ExtArgs> | null
    where?: BuoiKhamWhereInput
    orderBy?: BuoiKhamOrderByWithRelationInput | BuoiKhamOrderByWithRelationInput[]
    cursor?: BuoiKhamWhereUniqueInput
    take?: number
    skip?: number
    distinct?: BuoiKhamScalarFieldEnum | BuoiKhamScalarFieldEnum[]
  }

  /**
   * NguoiDungCSR.hoSoTuVan
   */
  export type NguoiDungCSR$hoSoTuVanArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HoSoBenhNhan
     */
    select?: HoSoBenhNhanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the HoSoBenhNhan
     */
    omit?: HoSoBenhNhanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HoSoBenhNhanInclude<ExtArgs> | null
    where?: HoSoBenhNhanWhereInput
    orderBy?: HoSoBenhNhanOrderByWithRelationInput | HoSoBenhNhanOrderByWithRelationInput[]
    cursor?: HoSoBenhNhanWhereUniqueInput
    take?: number
    skip?: number
    distinct?: HoSoBenhNhanScalarFieldEnum | HoSoBenhNhanScalarFieldEnum[]
  }

  /**
   * NguoiDungCSR.hoSoPhuTrach
   */
  export type NguoiDungCSR$hoSoPhuTrachArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HoSoBenhNhan
     */
    select?: HoSoBenhNhanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the HoSoBenhNhan
     */
    omit?: HoSoBenhNhanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HoSoBenhNhanInclude<ExtArgs> | null
    where?: HoSoBenhNhanWhereInput
    orderBy?: HoSoBenhNhanOrderByWithRelationInput | HoSoBenhNhanOrderByWithRelationInput[]
    cursor?: HoSoBenhNhanWhereUniqueInput
    take?: number
    skip?: number
    distinct?: HoSoBenhNhanScalarFieldEnum | HoSoBenhNhanScalarFieldEnum[]
  }

  /**
   * NguoiDungCSR.hoSoChotCuoi
   */
  export type NguoiDungCSR$hoSoChotCuoiArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HoSoBenhNhan
     */
    select?: HoSoBenhNhanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the HoSoBenhNhan
     */
    omit?: HoSoBenhNhanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HoSoBenhNhanInclude<ExtArgs> | null
    where?: HoSoBenhNhanWhereInput
    orderBy?: HoSoBenhNhanOrderByWithRelationInput | HoSoBenhNhanOrderByWithRelationInput[]
    cursor?: HoSoBenhNhanWhereUniqueInput
    take?: number
    skip?: number
    distinct?: HoSoBenhNhanScalarFieldEnum | HoSoBenhNhanScalarFieldEnum[]
  }

  /**
   * NguoiDungCSR.nhatKy
   */
  export type NguoiDungCSR$nhatKyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NhatKyTheoDoi
     */
    select?: NhatKyTheoDoiSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NhatKyTheoDoi
     */
    omit?: NhatKyTheoDoiOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NhatKyTheoDoiInclude<ExtArgs> | null
    where?: NhatKyTheoDoiWhereInput
    orderBy?: NhatKyTheoDoiOrderByWithRelationInput | NhatKyTheoDoiOrderByWithRelationInput[]
    cursor?: NhatKyTheoDoiWhereUniqueInput
    take?: number
    skip?: number
    distinct?: NhatKyTheoDoiScalarFieldEnum | NhatKyTheoDoiScalarFieldEnum[]
  }

  /**
   * NguoiDungCSR without action
   */
  export type NguoiDungCSRDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NguoiDungCSR
     */
    select?: NguoiDungCSRSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NguoiDungCSR
     */
    omit?: NguoiDungCSROmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NguoiDungCSRInclude<ExtArgs> | null
  }


  /**
   * Model BuoiKham
   */

  export type AggregateBuoiKham = {
    _count: BuoiKhamCountAggregateOutputType | null
    _min: BuoiKhamMinAggregateOutputType | null
    _max: BuoiKhamMaxAggregateOutputType | null
  }

  export type BuoiKhamMinAggregateOutputType = {
    id: string | null
    coSoId: string | null
    ngayKham: Date | null
    xa: string | null
    diaDiem: string | null
    ghiChu: string | null
    nguoiTao: string | null
    createdAt: Date | null
    syncStatus: string | null
  }

  export type BuoiKhamMaxAggregateOutputType = {
    id: string | null
    coSoId: string | null
    ngayKham: Date | null
    xa: string | null
    diaDiem: string | null
    ghiChu: string | null
    nguoiTao: string | null
    createdAt: Date | null
    syncStatus: string | null
  }

  export type BuoiKhamCountAggregateOutputType = {
    id: number
    coSoId: number
    ngayKham: number
    xa: number
    diaDiem: number
    ghiChu: number
    nguoiTao: number
    createdAt: number
    syncStatus: number
    _all: number
  }


  export type BuoiKhamMinAggregateInputType = {
    id?: true
    coSoId?: true
    ngayKham?: true
    xa?: true
    diaDiem?: true
    ghiChu?: true
    nguoiTao?: true
    createdAt?: true
    syncStatus?: true
  }

  export type BuoiKhamMaxAggregateInputType = {
    id?: true
    coSoId?: true
    ngayKham?: true
    xa?: true
    diaDiem?: true
    ghiChu?: true
    nguoiTao?: true
    createdAt?: true
    syncStatus?: true
  }

  export type BuoiKhamCountAggregateInputType = {
    id?: true
    coSoId?: true
    ngayKham?: true
    xa?: true
    diaDiem?: true
    ghiChu?: true
    nguoiTao?: true
    createdAt?: true
    syncStatus?: true
    _all?: true
  }

  export type BuoiKhamAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which BuoiKham to aggregate.
     */
    where?: BuoiKhamWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BuoiKhams to fetch.
     */
    orderBy?: BuoiKhamOrderByWithRelationInput | BuoiKhamOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: BuoiKhamWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BuoiKhams from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BuoiKhams.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned BuoiKhams
    **/
    _count?: true | BuoiKhamCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: BuoiKhamMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: BuoiKhamMaxAggregateInputType
  }

  export type GetBuoiKhamAggregateType<T extends BuoiKhamAggregateArgs> = {
        [P in keyof T & keyof AggregateBuoiKham]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateBuoiKham[P]>
      : GetScalarType<T[P], AggregateBuoiKham[P]>
  }




  export type BuoiKhamGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BuoiKhamWhereInput
    orderBy?: BuoiKhamOrderByWithAggregationInput | BuoiKhamOrderByWithAggregationInput[]
    by: BuoiKhamScalarFieldEnum[] | BuoiKhamScalarFieldEnum
    having?: BuoiKhamScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: BuoiKhamCountAggregateInputType | true
    _min?: BuoiKhamMinAggregateInputType
    _max?: BuoiKhamMaxAggregateInputType
  }

  export type BuoiKhamGroupByOutputType = {
    id: string
    coSoId: string
    ngayKham: Date
    xa: string
    diaDiem: string
    ghiChu: string | null
    nguoiTao: string
    createdAt: Date
    syncStatus: string
    _count: BuoiKhamCountAggregateOutputType | null
    _min: BuoiKhamMinAggregateOutputType | null
    _max: BuoiKhamMaxAggregateOutputType | null
  }

  type GetBuoiKhamGroupByPayload<T extends BuoiKhamGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<BuoiKhamGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof BuoiKhamGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], BuoiKhamGroupByOutputType[P]>
            : GetScalarType<T[P], BuoiKhamGroupByOutputType[P]>
        }
      >
    >


  export type BuoiKhamSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    coSoId?: boolean
    ngayKham?: boolean
    xa?: boolean
    diaDiem?: boolean
    ghiChu?: boolean
    nguoiTao?: boolean
    createdAt?: boolean
    syncStatus?: boolean
    coSo?: boolean | CoSoDefaultArgs<ExtArgs>
    nguoiTaoRef?: boolean | NguoiDungCSRDefaultArgs<ExtArgs>
    hoSo?: boolean | BuoiKham$hoSoArgs<ExtArgs>
    _count?: boolean | BuoiKhamCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["buoiKham"]>

  export type BuoiKhamSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    coSoId?: boolean
    ngayKham?: boolean
    xa?: boolean
    diaDiem?: boolean
    ghiChu?: boolean
    nguoiTao?: boolean
    createdAt?: boolean
    syncStatus?: boolean
    coSo?: boolean | CoSoDefaultArgs<ExtArgs>
    nguoiTaoRef?: boolean | NguoiDungCSRDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["buoiKham"]>

  export type BuoiKhamSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    coSoId?: boolean
    ngayKham?: boolean
    xa?: boolean
    diaDiem?: boolean
    ghiChu?: boolean
    nguoiTao?: boolean
    createdAt?: boolean
    syncStatus?: boolean
    coSo?: boolean | CoSoDefaultArgs<ExtArgs>
    nguoiTaoRef?: boolean | NguoiDungCSRDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["buoiKham"]>

  export type BuoiKhamSelectScalar = {
    id?: boolean
    coSoId?: boolean
    ngayKham?: boolean
    xa?: boolean
    diaDiem?: boolean
    ghiChu?: boolean
    nguoiTao?: boolean
    createdAt?: boolean
    syncStatus?: boolean
  }

  export type BuoiKhamOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "coSoId" | "ngayKham" | "xa" | "diaDiem" | "ghiChu" | "nguoiTao" | "createdAt" | "syncStatus", ExtArgs["result"]["buoiKham"]>
  export type BuoiKhamInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    coSo?: boolean | CoSoDefaultArgs<ExtArgs>
    nguoiTaoRef?: boolean | NguoiDungCSRDefaultArgs<ExtArgs>
    hoSo?: boolean | BuoiKham$hoSoArgs<ExtArgs>
    _count?: boolean | BuoiKhamCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type BuoiKhamIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    coSo?: boolean | CoSoDefaultArgs<ExtArgs>
    nguoiTaoRef?: boolean | NguoiDungCSRDefaultArgs<ExtArgs>
  }
  export type BuoiKhamIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    coSo?: boolean | CoSoDefaultArgs<ExtArgs>
    nguoiTaoRef?: boolean | NguoiDungCSRDefaultArgs<ExtArgs>
  }

  export type $BuoiKhamPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "BuoiKham"
    objects: {
      coSo: Prisma.$CoSoPayload<ExtArgs>
      nguoiTaoRef: Prisma.$NguoiDungCSRPayload<ExtArgs>
      hoSo: Prisma.$HoSoBenhNhanPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      coSoId: string
      ngayKham: Date
      xa: string
      diaDiem: string
      ghiChu: string | null
      nguoiTao: string
      createdAt: Date
      syncStatus: string
    }, ExtArgs["result"]["buoiKham"]>
    composites: {}
  }

  type BuoiKhamGetPayload<S extends boolean | null | undefined | BuoiKhamDefaultArgs> = $Result.GetResult<Prisma.$BuoiKhamPayload, S>

  type BuoiKhamCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<BuoiKhamFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: BuoiKhamCountAggregateInputType | true
    }

  export interface BuoiKhamDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['BuoiKham'], meta: { name: 'BuoiKham' } }
    /**
     * Find zero or one BuoiKham that matches the filter.
     * @param {BuoiKhamFindUniqueArgs} args - Arguments to find a BuoiKham
     * @example
     * // Get one BuoiKham
     * const buoiKham = await prisma.buoiKham.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends BuoiKhamFindUniqueArgs>(args: SelectSubset<T, BuoiKhamFindUniqueArgs<ExtArgs>>): Prisma__BuoiKhamClient<$Result.GetResult<Prisma.$BuoiKhamPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one BuoiKham that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {BuoiKhamFindUniqueOrThrowArgs} args - Arguments to find a BuoiKham
     * @example
     * // Get one BuoiKham
     * const buoiKham = await prisma.buoiKham.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends BuoiKhamFindUniqueOrThrowArgs>(args: SelectSubset<T, BuoiKhamFindUniqueOrThrowArgs<ExtArgs>>): Prisma__BuoiKhamClient<$Result.GetResult<Prisma.$BuoiKhamPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first BuoiKham that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BuoiKhamFindFirstArgs} args - Arguments to find a BuoiKham
     * @example
     * // Get one BuoiKham
     * const buoiKham = await prisma.buoiKham.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends BuoiKhamFindFirstArgs>(args?: SelectSubset<T, BuoiKhamFindFirstArgs<ExtArgs>>): Prisma__BuoiKhamClient<$Result.GetResult<Prisma.$BuoiKhamPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first BuoiKham that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BuoiKhamFindFirstOrThrowArgs} args - Arguments to find a BuoiKham
     * @example
     * // Get one BuoiKham
     * const buoiKham = await prisma.buoiKham.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends BuoiKhamFindFirstOrThrowArgs>(args?: SelectSubset<T, BuoiKhamFindFirstOrThrowArgs<ExtArgs>>): Prisma__BuoiKhamClient<$Result.GetResult<Prisma.$BuoiKhamPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more BuoiKhams that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BuoiKhamFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all BuoiKhams
     * const buoiKhams = await prisma.buoiKham.findMany()
     * 
     * // Get first 10 BuoiKhams
     * const buoiKhams = await prisma.buoiKham.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const buoiKhamWithIdOnly = await prisma.buoiKham.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends BuoiKhamFindManyArgs>(args?: SelectSubset<T, BuoiKhamFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BuoiKhamPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a BuoiKham.
     * @param {BuoiKhamCreateArgs} args - Arguments to create a BuoiKham.
     * @example
     * // Create one BuoiKham
     * const BuoiKham = await prisma.buoiKham.create({
     *   data: {
     *     // ... data to create a BuoiKham
     *   }
     * })
     * 
     */
    create<T extends BuoiKhamCreateArgs>(args: SelectSubset<T, BuoiKhamCreateArgs<ExtArgs>>): Prisma__BuoiKhamClient<$Result.GetResult<Prisma.$BuoiKhamPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many BuoiKhams.
     * @param {BuoiKhamCreateManyArgs} args - Arguments to create many BuoiKhams.
     * @example
     * // Create many BuoiKhams
     * const buoiKham = await prisma.buoiKham.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends BuoiKhamCreateManyArgs>(args?: SelectSubset<T, BuoiKhamCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many BuoiKhams and returns the data saved in the database.
     * @param {BuoiKhamCreateManyAndReturnArgs} args - Arguments to create many BuoiKhams.
     * @example
     * // Create many BuoiKhams
     * const buoiKham = await prisma.buoiKham.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many BuoiKhams and only return the `id`
     * const buoiKhamWithIdOnly = await prisma.buoiKham.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends BuoiKhamCreateManyAndReturnArgs>(args?: SelectSubset<T, BuoiKhamCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BuoiKhamPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a BuoiKham.
     * @param {BuoiKhamDeleteArgs} args - Arguments to delete one BuoiKham.
     * @example
     * // Delete one BuoiKham
     * const BuoiKham = await prisma.buoiKham.delete({
     *   where: {
     *     // ... filter to delete one BuoiKham
     *   }
     * })
     * 
     */
    delete<T extends BuoiKhamDeleteArgs>(args: SelectSubset<T, BuoiKhamDeleteArgs<ExtArgs>>): Prisma__BuoiKhamClient<$Result.GetResult<Prisma.$BuoiKhamPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one BuoiKham.
     * @param {BuoiKhamUpdateArgs} args - Arguments to update one BuoiKham.
     * @example
     * // Update one BuoiKham
     * const buoiKham = await prisma.buoiKham.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends BuoiKhamUpdateArgs>(args: SelectSubset<T, BuoiKhamUpdateArgs<ExtArgs>>): Prisma__BuoiKhamClient<$Result.GetResult<Prisma.$BuoiKhamPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more BuoiKhams.
     * @param {BuoiKhamDeleteManyArgs} args - Arguments to filter BuoiKhams to delete.
     * @example
     * // Delete a few BuoiKhams
     * const { count } = await prisma.buoiKham.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends BuoiKhamDeleteManyArgs>(args?: SelectSubset<T, BuoiKhamDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more BuoiKhams.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BuoiKhamUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many BuoiKhams
     * const buoiKham = await prisma.buoiKham.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends BuoiKhamUpdateManyArgs>(args: SelectSubset<T, BuoiKhamUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more BuoiKhams and returns the data updated in the database.
     * @param {BuoiKhamUpdateManyAndReturnArgs} args - Arguments to update many BuoiKhams.
     * @example
     * // Update many BuoiKhams
     * const buoiKham = await prisma.buoiKham.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more BuoiKhams and only return the `id`
     * const buoiKhamWithIdOnly = await prisma.buoiKham.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends BuoiKhamUpdateManyAndReturnArgs>(args: SelectSubset<T, BuoiKhamUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BuoiKhamPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one BuoiKham.
     * @param {BuoiKhamUpsertArgs} args - Arguments to update or create a BuoiKham.
     * @example
     * // Update or create a BuoiKham
     * const buoiKham = await prisma.buoiKham.upsert({
     *   create: {
     *     // ... data to create a BuoiKham
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the BuoiKham we want to update
     *   }
     * })
     */
    upsert<T extends BuoiKhamUpsertArgs>(args: SelectSubset<T, BuoiKhamUpsertArgs<ExtArgs>>): Prisma__BuoiKhamClient<$Result.GetResult<Prisma.$BuoiKhamPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of BuoiKhams.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BuoiKhamCountArgs} args - Arguments to filter BuoiKhams to count.
     * @example
     * // Count the number of BuoiKhams
     * const count = await prisma.buoiKham.count({
     *   where: {
     *     // ... the filter for the BuoiKhams we want to count
     *   }
     * })
    **/
    count<T extends BuoiKhamCountArgs>(
      args?: Subset<T, BuoiKhamCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], BuoiKhamCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a BuoiKham.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BuoiKhamAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends BuoiKhamAggregateArgs>(args: Subset<T, BuoiKhamAggregateArgs>): Prisma.PrismaPromise<GetBuoiKhamAggregateType<T>>

    /**
     * Group by BuoiKham.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BuoiKhamGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends BuoiKhamGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: BuoiKhamGroupByArgs['orderBy'] }
        : { orderBy?: BuoiKhamGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, BuoiKhamGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetBuoiKhamGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the BuoiKham model
   */
  readonly fields: BuoiKhamFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for BuoiKham.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__BuoiKhamClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    coSo<T extends CoSoDefaultArgs<ExtArgs> = {}>(args?: Subset<T, CoSoDefaultArgs<ExtArgs>>): Prisma__CoSoClient<$Result.GetResult<Prisma.$CoSoPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    nguoiTaoRef<T extends NguoiDungCSRDefaultArgs<ExtArgs> = {}>(args?: Subset<T, NguoiDungCSRDefaultArgs<ExtArgs>>): Prisma__NguoiDungCSRClient<$Result.GetResult<Prisma.$NguoiDungCSRPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    hoSo<T extends BuoiKham$hoSoArgs<ExtArgs> = {}>(args?: Subset<T, BuoiKham$hoSoArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$HoSoBenhNhanPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the BuoiKham model
   */
  interface BuoiKhamFieldRefs {
    readonly id: FieldRef<"BuoiKham", 'String'>
    readonly coSoId: FieldRef<"BuoiKham", 'String'>
    readonly ngayKham: FieldRef<"BuoiKham", 'DateTime'>
    readonly xa: FieldRef<"BuoiKham", 'String'>
    readonly diaDiem: FieldRef<"BuoiKham", 'String'>
    readonly ghiChu: FieldRef<"BuoiKham", 'String'>
    readonly nguoiTao: FieldRef<"BuoiKham", 'String'>
    readonly createdAt: FieldRef<"BuoiKham", 'DateTime'>
    readonly syncStatus: FieldRef<"BuoiKham", 'String'>
  }
    

  // Custom InputTypes
  /**
   * BuoiKham findUnique
   */
  export type BuoiKhamFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BuoiKham
     */
    select?: BuoiKhamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BuoiKham
     */
    omit?: BuoiKhamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BuoiKhamInclude<ExtArgs> | null
    /**
     * Filter, which BuoiKham to fetch.
     */
    where: BuoiKhamWhereUniqueInput
  }

  /**
   * BuoiKham findUniqueOrThrow
   */
  export type BuoiKhamFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BuoiKham
     */
    select?: BuoiKhamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BuoiKham
     */
    omit?: BuoiKhamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BuoiKhamInclude<ExtArgs> | null
    /**
     * Filter, which BuoiKham to fetch.
     */
    where: BuoiKhamWhereUniqueInput
  }

  /**
   * BuoiKham findFirst
   */
  export type BuoiKhamFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BuoiKham
     */
    select?: BuoiKhamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BuoiKham
     */
    omit?: BuoiKhamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BuoiKhamInclude<ExtArgs> | null
    /**
     * Filter, which BuoiKham to fetch.
     */
    where?: BuoiKhamWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BuoiKhams to fetch.
     */
    orderBy?: BuoiKhamOrderByWithRelationInput | BuoiKhamOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for BuoiKhams.
     */
    cursor?: BuoiKhamWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BuoiKhams from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BuoiKhams.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of BuoiKhams.
     */
    distinct?: BuoiKhamScalarFieldEnum | BuoiKhamScalarFieldEnum[]
  }

  /**
   * BuoiKham findFirstOrThrow
   */
  export type BuoiKhamFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BuoiKham
     */
    select?: BuoiKhamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BuoiKham
     */
    omit?: BuoiKhamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BuoiKhamInclude<ExtArgs> | null
    /**
     * Filter, which BuoiKham to fetch.
     */
    where?: BuoiKhamWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BuoiKhams to fetch.
     */
    orderBy?: BuoiKhamOrderByWithRelationInput | BuoiKhamOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for BuoiKhams.
     */
    cursor?: BuoiKhamWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BuoiKhams from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BuoiKhams.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of BuoiKhams.
     */
    distinct?: BuoiKhamScalarFieldEnum | BuoiKhamScalarFieldEnum[]
  }

  /**
   * BuoiKham findMany
   */
  export type BuoiKhamFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BuoiKham
     */
    select?: BuoiKhamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BuoiKham
     */
    omit?: BuoiKhamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BuoiKhamInclude<ExtArgs> | null
    /**
     * Filter, which BuoiKhams to fetch.
     */
    where?: BuoiKhamWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BuoiKhams to fetch.
     */
    orderBy?: BuoiKhamOrderByWithRelationInput | BuoiKhamOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing BuoiKhams.
     */
    cursor?: BuoiKhamWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BuoiKhams from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BuoiKhams.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of BuoiKhams.
     */
    distinct?: BuoiKhamScalarFieldEnum | BuoiKhamScalarFieldEnum[]
  }

  /**
   * BuoiKham create
   */
  export type BuoiKhamCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BuoiKham
     */
    select?: BuoiKhamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BuoiKham
     */
    omit?: BuoiKhamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BuoiKhamInclude<ExtArgs> | null
    /**
     * The data needed to create a BuoiKham.
     */
    data: XOR<BuoiKhamCreateInput, BuoiKhamUncheckedCreateInput>
  }

  /**
   * BuoiKham createMany
   */
  export type BuoiKhamCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many BuoiKhams.
     */
    data: BuoiKhamCreateManyInput | BuoiKhamCreateManyInput[]
  }

  /**
   * BuoiKham createManyAndReturn
   */
  export type BuoiKhamCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BuoiKham
     */
    select?: BuoiKhamSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the BuoiKham
     */
    omit?: BuoiKhamOmit<ExtArgs> | null
    /**
     * The data used to create many BuoiKhams.
     */
    data: BuoiKhamCreateManyInput | BuoiKhamCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BuoiKhamIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * BuoiKham update
   */
  export type BuoiKhamUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BuoiKham
     */
    select?: BuoiKhamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BuoiKham
     */
    omit?: BuoiKhamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BuoiKhamInclude<ExtArgs> | null
    /**
     * The data needed to update a BuoiKham.
     */
    data: XOR<BuoiKhamUpdateInput, BuoiKhamUncheckedUpdateInput>
    /**
     * Choose, which BuoiKham to update.
     */
    where: BuoiKhamWhereUniqueInput
  }

  /**
   * BuoiKham updateMany
   */
  export type BuoiKhamUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update BuoiKhams.
     */
    data: XOR<BuoiKhamUpdateManyMutationInput, BuoiKhamUncheckedUpdateManyInput>
    /**
     * Filter which BuoiKhams to update
     */
    where?: BuoiKhamWhereInput
    /**
     * Limit how many BuoiKhams to update.
     */
    limit?: number
  }

  /**
   * BuoiKham updateManyAndReturn
   */
  export type BuoiKhamUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BuoiKham
     */
    select?: BuoiKhamSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the BuoiKham
     */
    omit?: BuoiKhamOmit<ExtArgs> | null
    /**
     * The data used to update BuoiKhams.
     */
    data: XOR<BuoiKhamUpdateManyMutationInput, BuoiKhamUncheckedUpdateManyInput>
    /**
     * Filter which BuoiKhams to update
     */
    where?: BuoiKhamWhereInput
    /**
     * Limit how many BuoiKhams to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BuoiKhamIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * BuoiKham upsert
   */
  export type BuoiKhamUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BuoiKham
     */
    select?: BuoiKhamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BuoiKham
     */
    omit?: BuoiKhamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BuoiKhamInclude<ExtArgs> | null
    /**
     * The filter to search for the BuoiKham to update in case it exists.
     */
    where: BuoiKhamWhereUniqueInput
    /**
     * In case the BuoiKham found by the `where` argument doesn't exist, create a new BuoiKham with this data.
     */
    create: XOR<BuoiKhamCreateInput, BuoiKhamUncheckedCreateInput>
    /**
     * In case the BuoiKham was found with the provided `where` argument, update it with this data.
     */
    update: XOR<BuoiKhamUpdateInput, BuoiKhamUncheckedUpdateInput>
  }

  /**
   * BuoiKham delete
   */
  export type BuoiKhamDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BuoiKham
     */
    select?: BuoiKhamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BuoiKham
     */
    omit?: BuoiKhamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BuoiKhamInclude<ExtArgs> | null
    /**
     * Filter which BuoiKham to delete.
     */
    where: BuoiKhamWhereUniqueInput
  }

  /**
   * BuoiKham deleteMany
   */
  export type BuoiKhamDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which BuoiKhams to delete
     */
    where?: BuoiKhamWhereInput
    /**
     * Limit how many BuoiKhams to delete.
     */
    limit?: number
  }

  /**
   * BuoiKham.hoSo
   */
  export type BuoiKham$hoSoArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HoSoBenhNhan
     */
    select?: HoSoBenhNhanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the HoSoBenhNhan
     */
    omit?: HoSoBenhNhanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HoSoBenhNhanInclude<ExtArgs> | null
    where?: HoSoBenhNhanWhereInput
    orderBy?: HoSoBenhNhanOrderByWithRelationInput | HoSoBenhNhanOrderByWithRelationInput[]
    cursor?: HoSoBenhNhanWhereUniqueInput
    take?: number
    skip?: number
    distinct?: HoSoBenhNhanScalarFieldEnum | HoSoBenhNhanScalarFieldEnum[]
  }

  /**
   * BuoiKham without action
   */
  export type BuoiKhamDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BuoiKham
     */
    select?: BuoiKhamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BuoiKham
     */
    omit?: BuoiKhamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BuoiKhamInclude<ExtArgs> | null
  }


  /**
   * Model HoSoBenhNhan
   */

  export type AggregateHoSoBenhNhan = {
    _count: HoSoBenhNhanCountAggregateOutputType | null
    _avg: HoSoBenhNhanAvgAggregateOutputType | null
    _sum: HoSoBenhNhanSumAggregateOutputType | null
    _min: HoSoBenhNhanMinAggregateOutputType | null
    _max: HoSoBenhNhanMaxAggregateOutputType | null
  }

  export type HoSoBenhNhanAvgAggregateOutputType = {
    stt: number | null
    namSinh: number | null
    soTienBao: number | null
    soTienThucThu: number | null
  }

  export type HoSoBenhNhanSumAggregateOutputType = {
    stt: number | null
    namSinh: number | null
    soTienBao: number | null
    soTienThucThu: number | null
  }

  export type HoSoBenhNhanMinAggregateOutputType = {
    id: string | null
    maBN: string | null
    maBNHIS: string | null
    stt: number | null
    buoiKhamId: string | null
    coSoId: string | null
    hoTen: string | null
    gioiTinh: string | null
    ngaySinh: Date | null
    namSinh: number | null
    cccd: string | null
    diaChi: string | null
    sdt: string | null
    sdtNguoiNha: string | null
    thiLucMP: string | null
    thiLucMT: string | null
    chanDoan: string | null
    chanDoanKhac: string | null
    khuyenNghi: string | null
    bhyt: string | null
    tuVanVienMa: string | null
    soTienBao: number | null
    ngayDieuTri: Date | null
    diemDon: string | null
    gioDon: string | null
    nhom: string | null
    followUpStatus: string | null
    nguoiPhuTrachMa: string | null
    nguoiChotCuoiMa: string | null
    ngayChot: Date | null
    daDon: boolean | null
    ngayMoThucTe: Date | null
    soTienThucThu: number | null
    trangThaiDieuTri: string | null
    ngayTaiKham: Date | null
    ghiChuMat2: string | null
    trangThai: string | null
    createdAt: Date | null
    updatedAt: Date | null
    createdBy: string | null
    updatedBy: string | null
    syncStatus: string | null
  }

  export type HoSoBenhNhanMaxAggregateOutputType = {
    id: string | null
    maBN: string | null
    maBNHIS: string | null
    stt: number | null
    buoiKhamId: string | null
    coSoId: string | null
    hoTen: string | null
    gioiTinh: string | null
    ngaySinh: Date | null
    namSinh: number | null
    cccd: string | null
    diaChi: string | null
    sdt: string | null
    sdtNguoiNha: string | null
    thiLucMP: string | null
    thiLucMT: string | null
    chanDoan: string | null
    chanDoanKhac: string | null
    khuyenNghi: string | null
    bhyt: string | null
    tuVanVienMa: string | null
    soTienBao: number | null
    ngayDieuTri: Date | null
    diemDon: string | null
    gioDon: string | null
    nhom: string | null
    followUpStatus: string | null
    nguoiPhuTrachMa: string | null
    nguoiChotCuoiMa: string | null
    ngayChot: Date | null
    daDon: boolean | null
    ngayMoThucTe: Date | null
    soTienThucThu: number | null
    trangThaiDieuTri: string | null
    ngayTaiKham: Date | null
    ghiChuMat2: string | null
    trangThai: string | null
    createdAt: Date | null
    updatedAt: Date | null
    createdBy: string | null
    updatedBy: string | null
    syncStatus: string | null
  }

  export type HoSoBenhNhanCountAggregateOutputType = {
    id: number
    maBN: number
    maBNHIS: number
    stt: number
    buoiKhamId: number
    coSoId: number
    hoTen: number
    gioiTinh: number
    ngaySinh: number
    namSinh: number
    cccd: number
    diaChi: number
    sdt: number
    sdtNguoiNha: number
    thiLucMP: number
    thiLucMT: number
    chanDoan: number
    chanDoanKhac: number
    khuyenNghi: number
    bhyt: number
    tuVanVienMa: number
    soTienBao: number
    ngayDieuTri: number
    diemDon: number
    gioDon: number
    nhom: number
    followUpStatus: number
    nguoiPhuTrachMa: number
    nguoiChotCuoiMa: number
    ngayChot: number
    daDon: number
    ngayMoThucTe: number
    soTienThucThu: number
    trangThaiDieuTri: number
    ngayTaiKham: number
    ghiChuMat2: number
    trangThai: number
    createdAt: number
    updatedAt: number
    createdBy: number
    updatedBy: number
    syncStatus: number
    _all: number
  }


  export type HoSoBenhNhanAvgAggregateInputType = {
    stt?: true
    namSinh?: true
    soTienBao?: true
    soTienThucThu?: true
  }

  export type HoSoBenhNhanSumAggregateInputType = {
    stt?: true
    namSinh?: true
    soTienBao?: true
    soTienThucThu?: true
  }

  export type HoSoBenhNhanMinAggregateInputType = {
    id?: true
    maBN?: true
    maBNHIS?: true
    stt?: true
    buoiKhamId?: true
    coSoId?: true
    hoTen?: true
    gioiTinh?: true
    ngaySinh?: true
    namSinh?: true
    cccd?: true
    diaChi?: true
    sdt?: true
    sdtNguoiNha?: true
    thiLucMP?: true
    thiLucMT?: true
    chanDoan?: true
    chanDoanKhac?: true
    khuyenNghi?: true
    bhyt?: true
    tuVanVienMa?: true
    soTienBao?: true
    ngayDieuTri?: true
    diemDon?: true
    gioDon?: true
    nhom?: true
    followUpStatus?: true
    nguoiPhuTrachMa?: true
    nguoiChotCuoiMa?: true
    ngayChot?: true
    daDon?: true
    ngayMoThucTe?: true
    soTienThucThu?: true
    trangThaiDieuTri?: true
    ngayTaiKham?: true
    ghiChuMat2?: true
    trangThai?: true
    createdAt?: true
    updatedAt?: true
    createdBy?: true
    updatedBy?: true
    syncStatus?: true
  }

  export type HoSoBenhNhanMaxAggregateInputType = {
    id?: true
    maBN?: true
    maBNHIS?: true
    stt?: true
    buoiKhamId?: true
    coSoId?: true
    hoTen?: true
    gioiTinh?: true
    ngaySinh?: true
    namSinh?: true
    cccd?: true
    diaChi?: true
    sdt?: true
    sdtNguoiNha?: true
    thiLucMP?: true
    thiLucMT?: true
    chanDoan?: true
    chanDoanKhac?: true
    khuyenNghi?: true
    bhyt?: true
    tuVanVienMa?: true
    soTienBao?: true
    ngayDieuTri?: true
    diemDon?: true
    gioDon?: true
    nhom?: true
    followUpStatus?: true
    nguoiPhuTrachMa?: true
    nguoiChotCuoiMa?: true
    ngayChot?: true
    daDon?: true
    ngayMoThucTe?: true
    soTienThucThu?: true
    trangThaiDieuTri?: true
    ngayTaiKham?: true
    ghiChuMat2?: true
    trangThai?: true
    createdAt?: true
    updatedAt?: true
    createdBy?: true
    updatedBy?: true
    syncStatus?: true
  }

  export type HoSoBenhNhanCountAggregateInputType = {
    id?: true
    maBN?: true
    maBNHIS?: true
    stt?: true
    buoiKhamId?: true
    coSoId?: true
    hoTen?: true
    gioiTinh?: true
    ngaySinh?: true
    namSinh?: true
    cccd?: true
    diaChi?: true
    sdt?: true
    sdtNguoiNha?: true
    thiLucMP?: true
    thiLucMT?: true
    chanDoan?: true
    chanDoanKhac?: true
    khuyenNghi?: true
    bhyt?: true
    tuVanVienMa?: true
    soTienBao?: true
    ngayDieuTri?: true
    diemDon?: true
    gioDon?: true
    nhom?: true
    followUpStatus?: true
    nguoiPhuTrachMa?: true
    nguoiChotCuoiMa?: true
    ngayChot?: true
    daDon?: true
    ngayMoThucTe?: true
    soTienThucThu?: true
    trangThaiDieuTri?: true
    ngayTaiKham?: true
    ghiChuMat2?: true
    trangThai?: true
    createdAt?: true
    updatedAt?: true
    createdBy?: true
    updatedBy?: true
    syncStatus?: true
    _all?: true
  }

  export type HoSoBenhNhanAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which HoSoBenhNhan to aggregate.
     */
    where?: HoSoBenhNhanWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of HoSoBenhNhans to fetch.
     */
    orderBy?: HoSoBenhNhanOrderByWithRelationInput | HoSoBenhNhanOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: HoSoBenhNhanWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` HoSoBenhNhans from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` HoSoBenhNhans.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned HoSoBenhNhans
    **/
    _count?: true | HoSoBenhNhanCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: HoSoBenhNhanAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: HoSoBenhNhanSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: HoSoBenhNhanMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: HoSoBenhNhanMaxAggregateInputType
  }

  export type GetHoSoBenhNhanAggregateType<T extends HoSoBenhNhanAggregateArgs> = {
        [P in keyof T & keyof AggregateHoSoBenhNhan]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateHoSoBenhNhan[P]>
      : GetScalarType<T[P], AggregateHoSoBenhNhan[P]>
  }




  export type HoSoBenhNhanGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: HoSoBenhNhanWhereInput
    orderBy?: HoSoBenhNhanOrderByWithAggregationInput | HoSoBenhNhanOrderByWithAggregationInput[]
    by: HoSoBenhNhanScalarFieldEnum[] | HoSoBenhNhanScalarFieldEnum
    having?: HoSoBenhNhanScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: HoSoBenhNhanCountAggregateInputType | true
    _avg?: HoSoBenhNhanAvgAggregateInputType
    _sum?: HoSoBenhNhanSumAggregateInputType
    _min?: HoSoBenhNhanMinAggregateInputType
    _max?: HoSoBenhNhanMaxAggregateInputType
  }

  export type HoSoBenhNhanGroupByOutputType = {
    id: string
    maBN: string
    maBNHIS: string | null
    stt: number
    buoiKhamId: string
    coSoId: string
    hoTen: string
    gioiTinh: string
    ngaySinh: Date | null
    namSinh: number
    cccd: string | null
    diaChi: string | null
    sdt: string | null
    sdtNguoiNha: string | null
    thiLucMP: string | null
    thiLucMT: string | null
    chanDoan: string
    chanDoanKhac: string | null
    khuyenNghi: string | null
    bhyt: string | null
    tuVanVienMa: string | null
    soTienBao: number | null
    ngayDieuTri: Date | null
    diemDon: string | null
    gioDon: string | null
    nhom: string | null
    followUpStatus: string | null
    nguoiPhuTrachMa: string | null
    nguoiChotCuoiMa: string | null
    ngayChot: Date | null
    daDon: boolean
    ngayMoThucTe: Date | null
    soTienThucThu: number | null
    trangThaiDieuTri: string | null
    ngayTaiKham: Date | null
    ghiChuMat2: string | null
    trangThai: string
    createdAt: Date
    updatedAt: Date
    createdBy: string | null
    updatedBy: string | null
    syncStatus: string
    _count: HoSoBenhNhanCountAggregateOutputType | null
    _avg: HoSoBenhNhanAvgAggregateOutputType | null
    _sum: HoSoBenhNhanSumAggregateOutputType | null
    _min: HoSoBenhNhanMinAggregateOutputType | null
    _max: HoSoBenhNhanMaxAggregateOutputType | null
  }

  type GetHoSoBenhNhanGroupByPayload<T extends HoSoBenhNhanGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<HoSoBenhNhanGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof HoSoBenhNhanGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], HoSoBenhNhanGroupByOutputType[P]>
            : GetScalarType<T[P], HoSoBenhNhanGroupByOutputType[P]>
        }
      >
    >


  export type HoSoBenhNhanSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    maBN?: boolean
    maBNHIS?: boolean
    stt?: boolean
    buoiKhamId?: boolean
    coSoId?: boolean
    hoTen?: boolean
    gioiTinh?: boolean
    ngaySinh?: boolean
    namSinh?: boolean
    cccd?: boolean
    diaChi?: boolean
    sdt?: boolean
    sdtNguoiNha?: boolean
    thiLucMP?: boolean
    thiLucMT?: boolean
    chanDoan?: boolean
    chanDoanKhac?: boolean
    khuyenNghi?: boolean
    bhyt?: boolean
    tuVanVienMa?: boolean
    soTienBao?: boolean
    ngayDieuTri?: boolean
    diemDon?: boolean
    gioDon?: boolean
    nhom?: boolean
    followUpStatus?: boolean
    nguoiPhuTrachMa?: boolean
    nguoiChotCuoiMa?: boolean
    ngayChot?: boolean
    daDon?: boolean
    ngayMoThucTe?: boolean
    soTienThucThu?: boolean
    trangThaiDieuTri?: boolean
    ngayTaiKham?: boolean
    ghiChuMat2?: boolean
    trangThai?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    createdBy?: boolean
    updatedBy?: boolean
    syncStatus?: boolean
    buoiKham?: boolean | BuoiKhamDefaultArgs<ExtArgs>
    coSo?: boolean | CoSoDefaultArgs<ExtArgs>
    tuVanVien?: boolean | HoSoBenhNhan$tuVanVienArgs<ExtArgs>
    nguoiPhuTrach?: boolean | HoSoBenhNhan$nguoiPhuTrachArgs<ExtArgs>
    nguoiChotCuoi?: boolean | HoSoBenhNhan$nguoiChotCuoiArgs<ExtArgs>
    nhatKy?: boolean | HoSoBenhNhan$nhatKyArgs<ExtArgs>
    _count?: boolean | HoSoBenhNhanCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["hoSoBenhNhan"]>

  export type HoSoBenhNhanSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    maBN?: boolean
    maBNHIS?: boolean
    stt?: boolean
    buoiKhamId?: boolean
    coSoId?: boolean
    hoTen?: boolean
    gioiTinh?: boolean
    ngaySinh?: boolean
    namSinh?: boolean
    cccd?: boolean
    diaChi?: boolean
    sdt?: boolean
    sdtNguoiNha?: boolean
    thiLucMP?: boolean
    thiLucMT?: boolean
    chanDoan?: boolean
    chanDoanKhac?: boolean
    khuyenNghi?: boolean
    bhyt?: boolean
    tuVanVienMa?: boolean
    soTienBao?: boolean
    ngayDieuTri?: boolean
    diemDon?: boolean
    gioDon?: boolean
    nhom?: boolean
    followUpStatus?: boolean
    nguoiPhuTrachMa?: boolean
    nguoiChotCuoiMa?: boolean
    ngayChot?: boolean
    daDon?: boolean
    ngayMoThucTe?: boolean
    soTienThucThu?: boolean
    trangThaiDieuTri?: boolean
    ngayTaiKham?: boolean
    ghiChuMat2?: boolean
    trangThai?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    createdBy?: boolean
    updatedBy?: boolean
    syncStatus?: boolean
    buoiKham?: boolean | BuoiKhamDefaultArgs<ExtArgs>
    coSo?: boolean | CoSoDefaultArgs<ExtArgs>
    tuVanVien?: boolean | HoSoBenhNhan$tuVanVienArgs<ExtArgs>
    nguoiPhuTrach?: boolean | HoSoBenhNhan$nguoiPhuTrachArgs<ExtArgs>
    nguoiChotCuoi?: boolean | HoSoBenhNhan$nguoiChotCuoiArgs<ExtArgs>
  }, ExtArgs["result"]["hoSoBenhNhan"]>

  export type HoSoBenhNhanSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    maBN?: boolean
    maBNHIS?: boolean
    stt?: boolean
    buoiKhamId?: boolean
    coSoId?: boolean
    hoTen?: boolean
    gioiTinh?: boolean
    ngaySinh?: boolean
    namSinh?: boolean
    cccd?: boolean
    diaChi?: boolean
    sdt?: boolean
    sdtNguoiNha?: boolean
    thiLucMP?: boolean
    thiLucMT?: boolean
    chanDoan?: boolean
    chanDoanKhac?: boolean
    khuyenNghi?: boolean
    bhyt?: boolean
    tuVanVienMa?: boolean
    soTienBao?: boolean
    ngayDieuTri?: boolean
    diemDon?: boolean
    gioDon?: boolean
    nhom?: boolean
    followUpStatus?: boolean
    nguoiPhuTrachMa?: boolean
    nguoiChotCuoiMa?: boolean
    ngayChot?: boolean
    daDon?: boolean
    ngayMoThucTe?: boolean
    soTienThucThu?: boolean
    trangThaiDieuTri?: boolean
    ngayTaiKham?: boolean
    ghiChuMat2?: boolean
    trangThai?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    createdBy?: boolean
    updatedBy?: boolean
    syncStatus?: boolean
    buoiKham?: boolean | BuoiKhamDefaultArgs<ExtArgs>
    coSo?: boolean | CoSoDefaultArgs<ExtArgs>
    tuVanVien?: boolean | HoSoBenhNhan$tuVanVienArgs<ExtArgs>
    nguoiPhuTrach?: boolean | HoSoBenhNhan$nguoiPhuTrachArgs<ExtArgs>
    nguoiChotCuoi?: boolean | HoSoBenhNhan$nguoiChotCuoiArgs<ExtArgs>
  }, ExtArgs["result"]["hoSoBenhNhan"]>

  export type HoSoBenhNhanSelectScalar = {
    id?: boolean
    maBN?: boolean
    maBNHIS?: boolean
    stt?: boolean
    buoiKhamId?: boolean
    coSoId?: boolean
    hoTen?: boolean
    gioiTinh?: boolean
    ngaySinh?: boolean
    namSinh?: boolean
    cccd?: boolean
    diaChi?: boolean
    sdt?: boolean
    sdtNguoiNha?: boolean
    thiLucMP?: boolean
    thiLucMT?: boolean
    chanDoan?: boolean
    chanDoanKhac?: boolean
    khuyenNghi?: boolean
    bhyt?: boolean
    tuVanVienMa?: boolean
    soTienBao?: boolean
    ngayDieuTri?: boolean
    diemDon?: boolean
    gioDon?: boolean
    nhom?: boolean
    followUpStatus?: boolean
    nguoiPhuTrachMa?: boolean
    nguoiChotCuoiMa?: boolean
    ngayChot?: boolean
    daDon?: boolean
    ngayMoThucTe?: boolean
    soTienThucThu?: boolean
    trangThaiDieuTri?: boolean
    ngayTaiKham?: boolean
    ghiChuMat2?: boolean
    trangThai?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    createdBy?: boolean
    updatedBy?: boolean
    syncStatus?: boolean
  }

  export type HoSoBenhNhanOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "maBN" | "maBNHIS" | "stt" | "buoiKhamId" | "coSoId" | "hoTen" | "gioiTinh" | "ngaySinh" | "namSinh" | "cccd" | "diaChi" | "sdt" | "sdtNguoiNha" | "thiLucMP" | "thiLucMT" | "chanDoan" | "chanDoanKhac" | "khuyenNghi" | "bhyt" | "tuVanVienMa" | "soTienBao" | "ngayDieuTri" | "diemDon" | "gioDon" | "nhom" | "followUpStatus" | "nguoiPhuTrachMa" | "nguoiChotCuoiMa" | "ngayChot" | "daDon" | "ngayMoThucTe" | "soTienThucThu" | "trangThaiDieuTri" | "ngayTaiKham" | "ghiChuMat2" | "trangThai" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy" | "syncStatus", ExtArgs["result"]["hoSoBenhNhan"]>
  export type HoSoBenhNhanInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    buoiKham?: boolean | BuoiKhamDefaultArgs<ExtArgs>
    coSo?: boolean | CoSoDefaultArgs<ExtArgs>
    tuVanVien?: boolean | HoSoBenhNhan$tuVanVienArgs<ExtArgs>
    nguoiPhuTrach?: boolean | HoSoBenhNhan$nguoiPhuTrachArgs<ExtArgs>
    nguoiChotCuoi?: boolean | HoSoBenhNhan$nguoiChotCuoiArgs<ExtArgs>
    nhatKy?: boolean | HoSoBenhNhan$nhatKyArgs<ExtArgs>
    _count?: boolean | HoSoBenhNhanCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type HoSoBenhNhanIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    buoiKham?: boolean | BuoiKhamDefaultArgs<ExtArgs>
    coSo?: boolean | CoSoDefaultArgs<ExtArgs>
    tuVanVien?: boolean | HoSoBenhNhan$tuVanVienArgs<ExtArgs>
    nguoiPhuTrach?: boolean | HoSoBenhNhan$nguoiPhuTrachArgs<ExtArgs>
    nguoiChotCuoi?: boolean | HoSoBenhNhan$nguoiChotCuoiArgs<ExtArgs>
  }
  export type HoSoBenhNhanIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    buoiKham?: boolean | BuoiKhamDefaultArgs<ExtArgs>
    coSo?: boolean | CoSoDefaultArgs<ExtArgs>
    tuVanVien?: boolean | HoSoBenhNhan$tuVanVienArgs<ExtArgs>
    nguoiPhuTrach?: boolean | HoSoBenhNhan$nguoiPhuTrachArgs<ExtArgs>
    nguoiChotCuoi?: boolean | HoSoBenhNhan$nguoiChotCuoiArgs<ExtArgs>
  }

  export type $HoSoBenhNhanPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "HoSoBenhNhan"
    objects: {
      buoiKham: Prisma.$BuoiKhamPayload<ExtArgs>
      coSo: Prisma.$CoSoPayload<ExtArgs>
      tuVanVien: Prisma.$NguoiDungCSRPayload<ExtArgs> | null
      nguoiPhuTrach: Prisma.$NguoiDungCSRPayload<ExtArgs> | null
      nguoiChotCuoi: Prisma.$NguoiDungCSRPayload<ExtArgs> | null
      nhatKy: Prisma.$NhatKyTheoDoiPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      maBN: string
      maBNHIS: string | null
      stt: number
      buoiKhamId: string
      coSoId: string
      hoTen: string
      gioiTinh: string
      ngaySinh: Date | null
      namSinh: number
      cccd: string | null
      diaChi: string | null
      sdt: string | null
      sdtNguoiNha: string | null
      thiLucMP: string | null
      thiLucMT: string | null
      chanDoan: string
      chanDoanKhac: string | null
      khuyenNghi: string | null
      bhyt: string | null
      tuVanVienMa: string | null
      soTienBao: number | null
      ngayDieuTri: Date | null
      diemDon: string | null
      gioDon: string | null
      nhom: string | null
      followUpStatus: string | null
      nguoiPhuTrachMa: string | null
      nguoiChotCuoiMa: string | null
      ngayChot: Date | null
      daDon: boolean
      ngayMoThucTe: Date | null
      soTienThucThu: number | null
      trangThaiDieuTri: string | null
      ngayTaiKham: Date | null
      ghiChuMat2: string | null
      trangThai: string
      createdAt: Date
      updatedAt: Date
      createdBy: string | null
      updatedBy: string | null
      syncStatus: string
    }, ExtArgs["result"]["hoSoBenhNhan"]>
    composites: {}
  }

  type HoSoBenhNhanGetPayload<S extends boolean | null | undefined | HoSoBenhNhanDefaultArgs> = $Result.GetResult<Prisma.$HoSoBenhNhanPayload, S>

  type HoSoBenhNhanCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<HoSoBenhNhanFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: HoSoBenhNhanCountAggregateInputType | true
    }

  export interface HoSoBenhNhanDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['HoSoBenhNhan'], meta: { name: 'HoSoBenhNhan' } }
    /**
     * Find zero or one HoSoBenhNhan that matches the filter.
     * @param {HoSoBenhNhanFindUniqueArgs} args - Arguments to find a HoSoBenhNhan
     * @example
     * // Get one HoSoBenhNhan
     * const hoSoBenhNhan = await prisma.hoSoBenhNhan.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends HoSoBenhNhanFindUniqueArgs>(args: SelectSubset<T, HoSoBenhNhanFindUniqueArgs<ExtArgs>>): Prisma__HoSoBenhNhanClient<$Result.GetResult<Prisma.$HoSoBenhNhanPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one HoSoBenhNhan that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {HoSoBenhNhanFindUniqueOrThrowArgs} args - Arguments to find a HoSoBenhNhan
     * @example
     * // Get one HoSoBenhNhan
     * const hoSoBenhNhan = await prisma.hoSoBenhNhan.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends HoSoBenhNhanFindUniqueOrThrowArgs>(args: SelectSubset<T, HoSoBenhNhanFindUniqueOrThrowArgs<ExtArgs>>): Prisma__HoSoBenhNhanClient<$Result.GetResult<Prisma.$HoSoBenhNhanPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first HoSoBenhNhan that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HoSoBenhNhanFindFirstArgs} args - Arguments to find a HoSoBenhNhan
     * @example
     * // Get one HoSoBenhNhan
     * const hoSoBenhNhan = await prisma.hoSoBenhNhan.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends HoSoBenhNhanFindFirstArgs>(args?: SelectSubset<T, HoSoBenhNhanFindFirstArgs<ExtArgs>>): Prisma__HoSoBenhNhanClient<$Result.GetResult<Prisma.$HoSoBenhNhanPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first HoSoBenhNhan that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HoSoBenhNhanFindFirstOrThrowArgs} args - Arguments to find a HoSoBenhNhan
     * @example
     * // Get one HoSoBenhNhan
     * const hoSoBenhNhan = await prisma.hoSoBenhNhan.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends HoSoBenhNhanFindFirstOrThrowArgs>(args?: SelectSubset<T, HoSoBenhNhanFindFirstOrThrowArgs<ExtArgs>>): Prisma__HoSoBenhNhanClient<$Result.GetResult<Prisma.$HoSoBenhNhanPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more HoSoBenhNhans that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HoSoBenhNhanFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all HoSoBenhNhans
     * const hoSoBenhNhans = await prisma.hoSoBenhNhan.findMany()
     * 
     * // Get first 10 HoSoBenhNhans
     * const hoSoBenhNhans = await prisma.hoSoBenhNhan.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const hoSoBenhNhanWithIdOnly = await prisma.hoSoBenhNhan.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends HoSoBenhNhanFindManyArgs>(args?: SelectSubset<T, HoSoBenhNhanFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$HoSoBenhNhanPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a HoSoBenhNhan.
     * @param {HoSoBenhNhanCreateArgs} args - Arguments to create a HoSoBenhNhan.
     * @example
     * // Create one HoSoBenhNhan
     * const HoSoBenhNhan = await prisma.hoSoBenhNhan.create({
     *   data: {
     *     // ... data to create a HoSoBenhNhan
     *   }
     * })
     * 
     */
    create<T extends HoSoBenhNhanCreateArgs>(args: SelectSubset<T, HoSoBenhNhanCreateArgs<ExtArgs>>): Prisma__HoSoBenhNhanClient<$Result.GetResult<Prisma.$HoSoBenhNhanPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many HoSoBenhNhans.
     * @param {HoSoBenhNhanCreateManyArgs} args - Arguments to create many HoSoBenhNhans.
     * @example
     * // Create many HoSoBenhNhans
     * const hoSoBenhNhan = await prisma.hoSoBenhNhan.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends HoSoBenhNhanCreateManyArgs>(args?: SelectSubset<T, HoSoBenhNhanCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many HoSoBenhNhans and returns the data saved in the database.
     * @param {HoSoBenhNhanCreateManyAndReturnArgs} args - Arguments to create many HoSoBenhNhans.
     * @example
     * // Create many HoSoBenhNhans
     * const hoSoBenhNhan = await prisma.hoSoBenhNhan.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many HoSoBenhNhans and only return the `id`
     * const hoSoBenhNhanWithIdOnly = await prisma.hoSoBenhNhan.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends HoSoBenhNhanCreateManyAndReturnArgs>(args?: SelectSubset<T, HoSoBenhNhanCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$HoSoBenhNhanPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a HoSoBenhNhan.
     * @param {HoSoBenhNhanDeleteArgs} args - Arguments to delete one HoSoBenhNhan.
     * @example
     * // Delete one HoSoBenhNhan
     * const HoSoBenhNhan = await prisma.hoSoBenhNhan.delete({
     *   where: {
     *     // ... filter to delete one HoSoBenhNhan
     *   }
     * })
     * 
     */
    delete<T extends HoSoBenhNhanDeleteArgs>(args: SelectSubset<T, HoSoBenhNhanDeleteArgs<ExtArgs>>): Prisma__HoSoBenhNhanClient<$Result.GetResult<Prisma.$HoSoBenhNhanPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one HoSoBenhNhan.
     * @param {HoSoBenhNhanUpdateArgs} args - Arguments to update one HoSoBenhNhan.
     * @example
     * // Update one HoSoBenhNhan
     * const hoSoBenhNhan = await prisma.hoSoBenhNhan.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends HoSoBenhNhanUpdateArgs>(args: SelectSubset<T, HoSoBenhNhanUpdateArgs<ExtArgs>>): Prisma__HoSoBenhNhanClient<$Result.GetResult<Prisma.$HoSoBenhNhanPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more HoSoBenhNhans.
     * @param {HoSoBenhNhanDeleteManyArgs} args - Arguments to filter HoSoBenhNhans to delete.
     * @example
     * // Delete a few HoSoBenhNhans
     * const { count } = await prisma.hoSoBenhNhan.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends HoSoBenhNhanDeleteManyArgs>(args?: SelectSubset<T, HoSoBenhNhanDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more HoSoBenhNhans.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HoSoBenhNhanUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many HoSoBenhNhans
     * const hoSoBenhNhan = await prisma.hoSoBenhNhan.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends HoSoBenhNhanUpdateManyArgs>(args: SelectSubset<T, HoSoBenhNhanUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more HoSoBenhNhans and returns the data updated in the database.
     * @param {HoSoBenhNhanUpdateManyAndReturnArgs} args - Arguments to update many HoSoBenhNhans.
     * @example
     * // Update many HoSoBenhNhans
     * const hoSoBenhNhan = await prisma.hoSoBenhNhan.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more HoSoBenhNhans and only return the `id`
     * const hoSoBenhNhanWithIdOnly = await prisma.hoSoBenhNhan.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends HoSoBenhNhanUpdateManyAndReturnArgs>(args: SelectSubset<T, HoSoBenhNhanUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$HoSoBenhNhanPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one HoSoBenhNhan.
     * @param {HoSoBenhNhanUpsertArgs} args - Arguments to update or create a HoSoBenhNhan.
     * @example
     * // Update or create a HoSoBenhNhan
     * const hoSoBenhNhan = await prisma.hoSoBenhNhan.upsert({
     *   create: {
     *     // ... data to create a HoSoBenhNhan
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the HoSoBenhNhan we want to update
     *   }
     * })
     */
    upsert<T extends HoSoBenhNhanUpsertArgs>(args: SelectSubset<T, HoSoBenhNhanUpsertArgs<ExtArgs>>): Prisma__HoSoBenhNhanClient<$Result.GetResult<Prisma.$HoSoBenhNhanPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of HoSoBenhNhans.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HoSoBenhNhanCountArgs} args - Arguments to filter HoSoBenhNhans to count.
     * @example
     * // Count the number of HoSoBenhNhans
     * const count = await prisma.hoSoBenhNhan.count({
     *   where: {
     *     // ... the filter for the HoSoBenhNhans we want to count
     *   }
     * })
    **/
    count<T extends HoSoBenhNhanCountArgs>(
      args?: Subset<T, HoSoBenhNhanCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], HoSoBenhNhanCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a HoSoBenhNhan.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HoSoBenhNhanAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends HoSoBenhNhanAggregateArgs>(args: Subset<T, HoSoBenhNhanAggregateArgs>): Prisma.PrismaPromise<GetHoSoBenhNhanAggregateType<T>>

    /**
     * Group by HoSoBenhNhan.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HoSoBenhNhanGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends HoSoBenhNhanGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: HoSoBenhNhanGroupByArgs['orderBy'] }
        : { orderBy?: HoSoBenhNhanGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, HoSoBenhNhanGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetHoSoBenhNhanGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the HoSoBenhNhan model
   */
  readonly fields: HoSoBenhNhanFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for HoSoBenhNhan.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__HoSoBenhNhanClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    buoiKham<T extends BuoiKhamDefaultArgs<ExtArgs> = {}>(args?: Subset<T, BuoiKhamDefaultArgs<ExtArgs>>): Prisma__BuoiKhamClient<$Result.GetResult<Prisma.$BuoiKhamPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    coSo<T extends CoSoDefaultArgs<ExtArgs> = {}>(args?: Subset<T, CoSoDefaultArgs<ExtArgs>>): Prisma__CoSoClient<$Result.GetResult<Prisma.$CoSoPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    tuVanVien<T extends HoSoBenhNhan$tuVanVienArgs<ExtArgs> = {}>(args?: Subset<T, HoSoBenhNhan$tuVanVienArgs<ExtArgs>>): Prisma__NguoiDungCSRClient<$Result.GetResult<Prisma.$NguoiDungCSRPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    nguoiPhuTrach<T extends HoSoBenhNhan$nguoiPhuTrachArgs<ExtArgs> = {}>(args?: Subset<T, HoSoBenhNhan$nguoiPhuTrachArgs<ExtArgs>>): Prisma__NguoiDungCSRClient<$Result.GetResult<Prisma.$NguoiDungCSRPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    nguoiChotCuoi<T extends HoSoBenhNhan$nguoiChotCuoiArgs<ExtArgs> = {}>(args?: Subset<T, HoSoBenhNhan$nguoiChotCuoiArgs<ExtArgs>>): Prisma__NguoiDungCSRClient<$Result.GetResult<Prisma.$NguoiDungCSRPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    nhatKy<T extends HoSoBenhNhan$nhatKyArgs<ExtArgs> = {}>(args?: Subset<T, HoSoBenhNhan$nhatKyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NhatKyTheoDoiPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the HoSoBenhNhan model
   */
  interface HoSoBenhNhanFieldRefs {
    readonly id: FieldRef<"HoSoBenhNhan", 'String'>
    readonly maBN: FieldRef<"HoSoBenhNhan", 'String'>
    readonly maBNHIS: FieldRef<"HoSoBenhNhan", 'String'>
    readonly stt: FieldRef<"HoSoBenhNhan", 'Int'>
    readonly buoiKhamId: FieldRef<"HoSoBenhNhan", 'String'>
    readonly coSoId: FieldRef<"HoSoBenhNhan", 'String'>
    readonly hoTen: FieldRef<"HoSoBenhNhan", 'String'>
    readonly gioiTinh: FieldRef<"HoSoBenhNhan", 'String'>
    readonly ngaySinh: FieldRef<"HoSoBenhNhan", 'DateTime'>
    readonly namSinh: FieldRef<"HoSoBenhNhan", 'Int'>
    readonly cccd: FieldRef<"HoSoBenhNhan", 'String'>
    readonly diaChi: FieldRef<"HoSoBenhNhan", 'String'>
    readonly sdt: FieldRef<"HoSoBenhNhan", 'String'>
    readonly sdtNguoiNha: FieldRef<"HoSoBenhNhan", 'String'>
    readonly thiLucMP: FieldRef<"HoSoBenhNhan", 'String'>
    readonly thiLucMT: FieldRef<"HoSoBenhNhan", 'String'>
    readonly chanDoan: FieldRef<"HoSoBenhNhan", 'String'>
    readonly chanDoanKhac: FieldRef<"HoSoBenhNhan", 'String'>
    readonly khuyenNghi: FieldRef<"HoSoBenhNhan", 'String'>
    readonly bhyt: FieldRef<"HoSoBenhNhan", 'String'>
    readonly tuVanVienMa: FieldRef<"HoSoBenhNhan", 'String'>
    readonly soTienBao: FieldRef<"HoSoBenhNhan", 'Float'>
    readonly ngayDieuTri: FieldRef<"HoSoBenhNhan", 'DateTime'>
    readonly diemDon: FieldRef<"HoSoBenhNhan", 'String'>
    readonly gioDon: FieldRef<"HoSoBenhNhan", 'String'>
    readonly nhom: FieldRef<"HoSoBenhNhan", 'String'>
    readonly followUpStatus: FieldRef<"HoSoBenhNhan", 'String'>
    readonly nguoiPhuTrachMa: FieldRef<"HoSoBenhNhan", 'String'>
    readonly nguoiChotCuoiMa: FieldRef<"HoSoBenhNhan", 'String'>
    readonly ngayChot: FieldRef<"HoSoBenhNhan", 'DateTime'>
    readonly daDon: FieldRef<"HoSoBenhNhan", 'Boolean'>
    readonly ngayMoThucTe: FieldRef<"HoSoBenhNhan", 'DateTime'>
    readonly soTienThucThu: FieldRef<"HoSoBenhNhan", 'Float'>
    readonly trangThaiDieuTri: FieldRef<"HoSoBenhNhan", 'String'>
    readonly ngayTaiKham: FieldRef<"HoSoBenhNhan", 'DateTime'>
    readonly ghiChuMat2: FieldRef<"HoSoBenhNhan", 'String'>
    readonly trangThai: FieldRef<"HoSoBenhNhan", 'String'>
    readonly createdAt: FieldRef<"HoSoBenhNhan", 'DateTime'>
    readonly updatedAt: FieldRef<"HoSoBenhNhan", 'DateTime'>
    readonly createdBy: FieldRef<"HoSoBenhNhan", 'String'>
    readonly updatedBy: FieldRef<"HoSoBenhNhan", 'String'>
    readonly syncStatus: FieldRef<"HoSoBenhNhan", 'String'>
  }
    

  // Custom InputTypes
  /**
   * HoSoBenhNhan findUnique
   */
  export type HoSoBenhNhanFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HoSoBenhNhan
     */
    select?: HoSoBenhNhanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the HoSoBenhNhan
     */
    omit?: HoSoBenhNhanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HoSoBenhNhanInclude<ExtArgs> | null
    /**
     * Filter, which HoSoBenhNhan to fetch.
     */
    where: HoSoBenhNhanWhereUniqueInput
  }

  /**
   * HoSoBenhNhan findUniqueOrThrow
   */
  export type HoSoBenhNhanFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HoSoBenhNhan
     */
    select?: HoSoBenhNhanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the HoSoBenhNhan
     */
    omit?: HoSoBenhNhanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HoSoBenhNhanInclude<ExtArgs> | null
    /**
     * Filter, which HoSoBenhNhan to fetch.
     */
    where: HoSoBenhNhanWhereUniqueInput
  }

  /**
   * HoSoBenhNhan findFirst
   */
  export type HoSoBenhNhanFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HoSoBenhNhan
     */
    select?: HoSoBenhNhanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the HoSoBenhNhan
     */
    omit?: HoSoBenhNhanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HoSoBenhNhanInclude<ExtArgs> | null
    /**
     * Filter, which HoSoBenhNhan to fetch.
     */
    where?: HoSoBenhNhanWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of HoSoBenhNhans to fetch.
     */
    orderBy?: HoSoBenhNhanOrderByWithRelationInput | HoSoBenhNhanOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for HoSoBenhNhans.
     */
    cursor?: HoSoBenhNhanWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` HoSoBenhNhans from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` HoSoBenhNhans.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of HoSoBenhNhans.
     */
    distinct?: HoSoBenhNhanScalarFieldEnum | HoSoBenhNhanScalarFieldEnum[]
  }

  /**
   * HoSoBenhNhan findFirstOrThrow
   */
  export type HoSoBenhNhanFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HoSoBenhNhan
     */
    select?: HoSoBenhNhanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the HoSoBenhNhan
     */
    omit?: HoSoBenhNhanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HoSoBenhNhanInclude<ExtArgs> | null
    /**
     * Filter, which HoSoBenhNhan to fetch.
     */
    where?: HoSoBenhNhanWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of HoSoBenhNhans to fetch.
     */
    orderBy?: HoSoBenhNhanOrderByWithRelationInput | HoSoBenhNhanOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for HoSoBenhNhans.
     */
    cursor?: HoSoBenhNhanWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` HoSoBenhNhans from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` HoSoBenhNhans.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of HoSoBenhNhans.
     */
    distinct?: HoSoBenhNhanScalarFieldEnum | HoSoBenhNhanScalarFieldEnum[]
  }

  /**
   * HoSoBenhNhan findMany
   */
  export type HoSoBenhNhanFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HoSoBenhNhan
     */
    select?: HoSoBenhNhanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the HoSoBenhNhan
     */
    omit?: HoSoBenhNhanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HoSoBenhNhanInclude<ExtArgs> | null
    /**
     * Filter, which HoSoBenhNhans to fetch.
     */
    where?: HoSoBenhNhanWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of HoSoBenhNhans to fetch.
     */
    orderBy?: HoSoBenhNhanOrderByWithRelationInput | HoSoBenhNhanOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing HoSoBenhNhans.
     */
    cursor?: HoSoBenhNhanWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` HoSoBenhNhans from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` HoSoBenhNhans.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of HoSoBenhNhans.
     */
    distinct?: HoSoBenhNhanScalarFieldEnum | HoSoBenhNhanScalarFieldEnum[]
  }

  /**
   * HoSoBenhNhan create
   */
  export type HoSoBenhNhanCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HoSoBenhNhan
     */
    select?: HoSoBenhNhanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the HoSoBenhNhan
     */
    omit?: HoSoBenhNhanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HoSoBenhNhanInclude<ExtArgs> | null
    /**
     * The data needed to create a HoSoBenhNhan.
     */
    data: XOR<HoSoBenhNhanCreateInput, HoSoBenhNhanUncheckedCreateInput>
  }

  /**
   * HoSoBenhNhan createMany
   */
  export type HoSoBenhNhanCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many HoSoBenhNhans.
     */
    data: HoSoBenhNhanCreateManyInput | HoSoBenhNhanCreateManyInput[]
  }

  /**
   * HoSoBenhNhan createManyAndReturn
   */
  export type HoSoBenhNhanCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HoSoBenhNhan
     */
    select?: HoSoBenhNhanSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the HoSoBenhNhan
     */
    omit?: HoSoBenhNhanOmit<ExtArgs> | null
    /**
     * The data used to create many HoSoBenhNhans.
     */
    data: HoSoBenhNhanCreateManyInput | HoSoBenhNhanCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HoSoBenhNhanIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * HoSoBenhNhan update
   */
  export type HoSoBenhNhanUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HoSoBenhNhan
     */
    select?: HoSoBenhNhanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the HoSoBenhNhan
     */
    omit?: HoSoBenhNhanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HoSoBenhNhanInclude<ExtArgs> | null
    /**
     * The data needed to update a HoSoBenhNhan.
     */
    data: XOR<HoSoBenhNhanUpdateInput, HoSoBenhNhanUncheckedUpdateInput>
    /**
     * Choose, which HoSoBenhNhan to update.
     */
    where: HoSoBenhNhanWhereUniqueInput
  }

  /**
   * HoSoBenhNhan updateMany
   */
  export type HoSoBenhNhanUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update HoSoBenhNhans.
     */
    data: XOR<HoSoBenhNhanUpdateManyMutationInput, HoSoBenhNhanUncheckedUpdateManyInput>
    /**
     * Filter which HoSoBenhNhans to update
     */
    where?: HoSoBenhNhanWhereInput
    /**
     * Limit how many HoSoBenhNhans to update.
     */
    limit?: number
  }

  /**
   * HoSoBenhNhan updateManyAndReturn
   */
  export type HoSoBenhNhanUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HoSoBenhNhan
     */
    select?: HoSoBenhNhanSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the HoSoBenhNhan
     */
    omit?: HoSoBenhNhanOmit<ExtArgs> | null
    /**
     * The data used to update HoSoBenhNhans.
     */
    data: XOR<HoSoBenhNhanUpdateManyMutationInput, HoSoBenhNhanUncheckedUpdateManyInput>
    /**
     * Filter which HoSoBenhNhans to update
     */
    where?: HoSoBenhNhanWhereInput
    /**
     * Limit how many HoSoBenhNhans to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HoSoBenhNhanIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * HoSoBenhNhan upsert
   */
  export type HoSoBenhNhanUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HoSoBenhNhan
     */
    select?: HoSoBenhNhanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the HoSoBenhNhan
     */
    omit?: HoSoBenhNhanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HoSoBenhNhanInclude<ExtArgs> | null
    /**
     * The filter to search for the HoSoBenhNhan to update in case it exists.
     */
    where: HoSoBenhNhanWhereUniqueInput
    /**
     * In case the HoSoBenhNhan found by the `where` argument doesn't exist, create a new HoSoBenhNhan with this data.
     */
    create: XOR<HoSoBenhNhanCreateInput, HoSoBenhNhanUncheckedCreateInput>
    /**
     * In case the HoSoBenhNhan was found with the provided `where` argument, update it with this data.
     */
    update: XOR<HoSoBenhNhanUpdateInput, HoSoBenhNhanUncheckedUpdateInput>
  }

  /**
   * HoSoBenhNhan delete
   */
  export type HoSoBenhNhanDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HoSoBenhNhan
     */
    select?: HoSoBenhNhanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the HoSoBenhNhan
     */
    omit?: HoSoBenhNhanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HoSoBenhNhanInclude<ExtArgs> | null
    /**
     * Filter which HoSoBenhNhan to delete.
     */
    where: HoSoBenhNhanWhereUniqueInput
  }

  /**
   * HoSoBenhNhan deleteMany
   */
  export type HoSoBenhNhanDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which HoSoBenhNhans to delete
     */
    where?: HoSoBenhNhanWhereInput
    /**
     * Limit how many HoSoBenhNhans to delete.
     */
    limit?: number
  }

  /**
   * HoSoBenhNhan.tuVanVien
   */
  export type HoSoBenhNhan$tuVanVienArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NguoiDungCSR
     */
    select?: NguoiDungCSRSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NguoiDungCSR
     */
    omit?: NguoiDungCSROmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NguoiDungCSRInclude<ExtArgs> | null
    where?: NguoiDungCSRWhereInput
  }

  /**
   * HoSoBenhNhan.nguoiPhuTrach
   */
  export type HoSoBenhNhan$nguoiPhuTrachArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NguoiDungCSR
     */
    select?: NguoiDungCSRSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NguoiDungCSR
     */
    omit?: NguoiDungCSROmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NguoiDungCSRInclude<ExtArgs> | null
    where?: NguoiDungCSRWhereInput
  }

  /**
   * HoSoBenhNhan.nguoiChotCuoi
   */
  export type HoSoBenhNhan$nguoiChotCuoiArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NguoiDungCSR
     */
    select?: NguoiDungCSRSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NguoiDungCSR
     */
    omit?: NguoiDungCSROmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NguoiDungCSRInclude<ExtArgs> | null
    where?: NguoiDungCSRWhereInput
  }

  /**
   * HoSoBenhNhan.nhatKy
   */
  export type HoSoBenhNhan$nhatKyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NhatKyTheoDoi
     */
    select?: NhatKyTheoDoiSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NhatKyTheoDoi
     */
    omit?: NhatKyTheoDoiOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NhatKyTheoDoiInclude<ExtArgs> | null
    where?: NhatKyTheoDoiWhereInput
    orderBy?: NhatKyTheoDoiOrderByWithRelationInput | NhatKyTheoDoiOrderByWithRelationInput[]
    cursor?: NhatKyTheoDoiWhereUniqueInput
    take?: number
    skip?: number
    distinct?: NhatKyTheoDoiScalarFieldEnum | NhatKyTheoDoiScalarFieldEnum[]
  }

  /**
   * HoSoBenhNhan without action
   */
  export type HoSoBenhNhanDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HoSoBenhNhan
     */
    select?: HoSoBenhNhanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the HoSoBenhNhan
     */
    omit?: HoSoBenhNhanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HoSoBenhNhanInclude<ExtArgs> | null
  }


  /**
   * Model NhatKyTheoDoi
   */

  export type AggregateNhatKyTheoDoi = {
    _count: NhatKyTheoDoiCountAggregateOutputType | null
    _min: NhatKyTheoDoiMinAggregateOutputType | null
    _max: NhatKyTheoDoiMaxAggregateOutputType | null
  }

  export type NhatKyTheoDoiMinAggregateOutputType = {
    id: string | null
    hoSoId: string | null
    ngay: Date | null
    nguoiGoiMa: string | null
    noiDung: string | null
    syncStatus: string | null
  }

  export type NhatKyTheoDoiMaxAggregateOutputType = {
    id: string | null
    hoSoId: string | null
    ngay: Date | null
    nguoiGoiMa: string | null
    noiDung: string | null
    syncStatus: string | null
  }

  export type NhatKyTheoDoiCountAggregateOutputType = {
    id: number
    hoSoId: number
    ngay: number
    nguoiGoiMa: number
    noiDung: number
    syncStatus: number
    _all: number
  }


  export type NhatKyTheoDoiMinAggregateInputType = {
    id?: true
    hoSoId?: true
    ngay?: true
    nguoiGoiMa?: true
    noiDung?: true
    syncStatus?: true
  }

  export type NhatKyTheoDoiMaxAggregateInputType = {
    id?: true
    hoSoId?: true
    ngay?: true
    nguoiGoiMa?: true
    noiDung?: true
    syncStatus?: true
  }

  export type NhatKyTheoDoiCountAggregateInputType = {
    id?: true
    hoSoId?: true
    ngay?: true
    nguoiGoiMa?: true
    noiDung?: true
    syncStatus?: true
    _all?: true
  }

  export type NhatKyTheoDoiAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which NhatKyTheoDoi to aggregate.
     */
    where?: NhatKyTheoDoiWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of NhatKyTheoDois to fetch.
     */
    orderBy?: NhatKyTheoDoiOrderByWithRelationInput | NhatKyTheoDoiOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: NhatKyTheoDoiWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` NhatKyTheoDois from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` NhatKyTheoDois.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned NhatKyTheoDois
    **/
    _count?: true | NhatKyTheoDoiCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: NhatKyTheoDoiMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: NhatKyTheoDoiMaxAggregateInputType
  }

  export type GetNhatKyTheoDoiAggregateType<T extends NhatKyTheoDoiAggregateArgs> = {
        [P in keyof T & keyof AggregateNhatKyTheoDoi]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateNhatKyTheoDoi[P]>
      : GetScalarType<T[P], AggregateNhatKyTheoDoi[P]>
  }




  export type NhatKyTheoDoiGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: NhatKyTheoDoiWhereInput
    orderBy?: NhatKyTheoDoiOrderByWithAggregationInput | NhatKyTheoDoiOrderByWithAggregationInput[]
    by: NhatKyTheoDoiScalarFieldEnum[] | NhatKyTheoDoiScalarFieldEnum
    having?: NhatKyTheoDoiScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: NhatKyTheoDoiCountAggregateInputType | true
    _min?: NhatKyTheoDoiMinAggregateInputType
    _max?: NhatKyTheoDoiMaxAggregateInputType
  }

  export type NhatKyTheoDoiGroupByOutputType = {
    id: string
    hoSoId: string
    ngay: Date
    nguoiGoiMa: string
    noiDung: string
    syncStatus: string
    _count: NhatKyTheoDoiCountAggregateOutputType | null
    _min: NhatKyTheoDoiMinAggregateOutputType | null
    _max: NhatKyTheoDoiMaxAggregateOutputType | null
  }

  type GetNhatKyTheoDoiGroupByPayload<T extends NhatKyTheoDoiGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<NhatKyTheoDoiGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof NhatKyTheoDoiGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], NhatKyTheoDoiGroupByOutputType[P]>
            : GetScalarType<T[P], NhatKyTheoDoiGroupByOutputType[P]>
        }
      >
    >


  export type NhatKyTheoDoiSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    hoSoId?: boolean
    ngay?: boolean
    nguoiGoiMa?: boolean
    noiDung?: boolean
    syncStatus?: boolean
    hoSo?: boolean | HoSoBenhNhanDefaultArgs<ExtArgs>
    nguoiGoi?: boolean | NguoiDungCSRDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["nhatKyTheoDoi"]>

  export type NhatKyTheoDoiSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    hoSoId?: boolean
    ngay?: boolean
    nguoiGoiMa?: boolean
    noiDung?: boolean
    syncStatus?: boolean
    hoSo?: boolean | HoSoBenhNhanDefaultArgs<ExtArgs>
    nguoiGoi?: boolean | NguoiDungCSRDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["nhatKyTheoDoi"]>

  export type NhatKyTheoDoiSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    hoSoId?: boolean
    ngay?: boolean
    nguoiGoiMa?: boolean
    noiDung?: boolean
    syncStatus?: boolean
    hoSo?: boolean | HoSoBenhNhanDefaultArgs<ExtArgs>
    nguoiGoi?: boolean | NguoiDungCSRDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["nhatKyTheoDoi"]>

  export type NhatKyTheoDoiSelectScalar = {
    id?: boolean
    hoSoId?: boolean
    ngay?: boolean
    nguoiGoiMa?: boolean
    noiDung?: boolean
    syncStatus?: boolean
  }

  export type NhatKyTheoDoiOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "hoSoId" | "ngay" | "nguoiGoiMa" | "noiDung" | "syncStatus", ExtArgs["result"]["nhatKyTheoDoi"]>
  export type NhatKyTheoDoiInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    hoSo?: boolean | HoSoBenhNhanDefaultArgs<ExtArgs>
    nguoiGoi?: boolean | NguoiDungCSRDefaultArgs<ExtArgs>
  }
  export type NhatKyTheoDoiIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    hoSo?: boolean | HoSoBenhNhanDefaultArgs<ExtArgs>
    nguoiGoi?: boolean | NguoiDungCSRDefaultArgs<ExtArgs>
  }
  export type NhatKyTheoDoiIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    hoSo?: boolean | HoSoBenhNhanDefaultArgs<ExtArgs>
    nguoiGoi?: boolean | NguoiDungCSRDefaultArgs<ExtArgs>
  }

  export type $NhatKyTheoDoiPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "NhatKyTheoDoi"
    objects: {
      hoSo: Prisma.$HoSoBenhNhanPayload<ExtArgs>
      nguoiGoi: Prisma.$NguoiDungCSRPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      hoSoId: string
      ngay: Date
      nguoiGoiMa: string
      noiDung: string
      syncStatus: string
    }, ExtArgs["result"]["nhatKyTheoDoi"]>
    composites: {}
  }

  type NhatKyTheoDoiGetPayload<S extends boolean | null | undefined | NhatKyTheoDoiDefaultArgs> = $Result.GetResult<Prisma.$NhatKyTheoDoiPayload, S>

  type NhatKyTheoDoiCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<NhatKyTheoDoiFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: NhatKyTheoDoiCountAggregateInputType | true
    }

  export interface NhatKyTheoDoiDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['NhatKyTheoDoi'], meta: { name: 'NhatKyTheoDoi' } }
    /**
     * Find zero or one NhatKyTheoDoi that matches the filter.
     * @param {NhatKyTheoDoiFindUniqueArgs} args - Arguments to find a NhatKyTheoDoi
     * @example
     * // Get one NhatKyTheoDoi
     * const nhatKyTheoDoi = await prisma.nhatKyTheoDoi.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends NhatKyTheoDoiFindUniqueArgs>(args: SelectSubset<T, NhatKyTheoDoiFindUniqueArgs<ExtArgs>>): Prisma__NhatKyTheoDoiClient<$Result.GetResult<Prisma.$NhatKyTheoDoiPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one NhatKyTheoDoi that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {NhatKyTheoDoiFindUniqueOrThrowArgs} args - Arguments to find a NhatKyTheoDoi
     * @example
     * // Get one NhatKyTheoDoi
     * const nhatKyTheoDoi = await prisma.nhatKyTheoDoi.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends NhatKyTheoDoiFindUniqueOrThrowArgs>(args: SelectSubset<T, NhatKyTheoDoiFindUniqueOrThrowArgs<ExtArgs>>): Prisma__NhatKyTheoDoiClient<$Result.GetResult<Prisma.$NhatKyTheoDoiPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first NhatKyTheoDoi that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NhatKyTheoDoiFindFirstArgs} args - Arguments to find a NhatKyTheoDoi
     * @example
     * // Get one NhatKyTheoDoi
     * const nhatKyTheoDoi = await prisma.nhatKyTheoDoi.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends NhatKyTheoDoiFindFirstArgs>(args?: SelectSubset<T, NhatKyTheoDoiFindFirstArgs<ExtArgs>>): Prisma__NhatKyTheoDoiClient<$Result.GetResult<Prisma.$NhatKyTheoDoiPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first NhatKyTheoDoi that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NhatKyTheoDoiFindFirstOrThrowArgs} args - Arguments to find a NhatKyTheoDoi
     * @example
     * // Get one NhatKyTheoDoi
     * const nhatKyTheoDoi = await prisma.nhatKyTheoDoi.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends NhatKyTheoDoiFindFirstOrThrowArgs>(args?: SelectSubset<T, NhatKyTheoDoiFindFirstOrThrowArgs<ExtArgs>>): Prisma__NhatKyTheoDoiClient<$Result.GetResult<Prisma.$NhatKyTheoDoiPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more NhatKyTheoDois that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NhatKyTheoDoiFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all NhatKyTheoDois
     * const nhatKyTheoDois = await prisma.nhatKyTheoDoi.findMany()
     * 
     * // Get first 10 NhatKyTheoDois
     * const nhatKyTheoDois = await prisma.nhatKyTheoDoi.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const nhatKyTheoDoiWithIdOnly = await prisma.nhatKyTheoDoi.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends NhatKyTheoDoiFindManyArgs>(args?: SelectSubset<T, NhatKyTheoDoiFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NhatKyTheoDoiPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a NhatKyTheoDoi.
     * @param {NhatKyTheoDoiCreateArgs} args - Arguments to create a NhatKyTheoDoi.
     * @example
     * // Create one NhatKyTheoDoi
     * const NhatKyTheoDoi = await prisma.nhatKyTheoDoi.create({
     *   data: {
     *     // ... data to create a NhatKyTheoDoi
     *   }
     * })
     * 
     */
    create<T extends NhatKyTheoDoiCreateArgs>(args: SelectSubset<T, NhatKyTheoDoiCreateArgs<ExtArgs>>): Prisma__NhatKyTheoDoiClient<$Result.GetResult<Prisma.$NhatKyTheoDoiPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many NhatKyTheoDois.
     * @param {NhatKyTheoDoiCreateManyArgs} args - Arguments to create many NhatKyTheoDois.
     * @example
     * // Create many NhatKyTheoDois
     * const nhatKyTheoDoi = await prisma.nhatKyTheoDoi.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends NhatKyTheoDoiCreateManyArgs>(args?: SelectSubset<T, NhatKyTheoDoiCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many NhatKyTheoDois and returns the data saved in the database.
     * @param {NhatKyTheoDoiCreateManyAndReturnArgs} args - Arguments to create many NhatKyTheoDois.
     * @example
     * // Create many NhatKyTheoDois
     * const nhatKyTheoDoi = await prisma.nhatKyTheoDoi.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many NhatKyTheoDois and only return the `id`
     * const nhatKyTheoDoiWithIdOnly = await prisma.nhatKyTheoDoi.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends NhatKyTheoDoiCreateManyAndReturnArgs>(args?: SelectSubset<T, NhatKyTheoDoiCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NhatKyTheoDoiPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a NhatKyTheoDoi.
     * @param {NhatKyTheoDoiDeleteArgs} args - Arguments to delete one NhatKyTheoDoi.
     * @example
     * // Delete one NhatKyTheoDoi
     * const NhatKyTheoDoi = await prisma.nhatKyTheoDoi.delete({
     *   where: {
     *     // ... filter to delete one NhatKyTheoDoi
     *   }
     * })
     * 
     */
    delete<T extends NhatKyTheoDoiDeleteArgs>(args: SelectSubset<T, NhatKyTheoDoiDeleteArgs<ExtArgs>>): Prisma__NhatKyTheoDoiClient<$Result.GetResult<Prisma.$NhatKyTheoDoiPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one NhatKyTheoDoi.
     * @param {NhatKyTheoDoiUpdateArgs} args - Arguments to update one NhatKyTheoDoi.
     * @example
     * // Update one NhatKyTheoDoi
     * const nhatKyTheoDoi = await prisma.nhatKyTheoDoi.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends NhatKyTheoDoiUpdateArgs>(args: SelectSubset<T, NhatKyTheoDoiUpdateArgs<ExtArgs>>): Prisma__NhatKyTheoDoiClient<$Result.GetResult<Prisma.$NhatKyTheoDoiPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more NhatKyTheoDois.
     * @param {NhatKyTheoDoiDeleteManyArgs} args - Arguments to filter NhatKyTheoDois to delete.
     * @example
     * // Delete a few NhatKyTheoDois
     * const { count } = await prisma.nhatKyTheoDoi.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends NhatKyTheoDoiDeleteManyArgs>(args?: SelectSubset<T, NhatKyTheoDoiDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more NhatKyTheoDois.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NhatKyTheoDoiUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many NhatKyTheoDois
     * const nhatKyTheoDoi = await prisma.nhatKyTheoDoi.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends NhatKyTheoDoiUpdateManyArgs>(args: SelectSubset<T, NhatKyTheoDoiUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more NhatKyTheoDois and returns the data updated in the database.
     * @param {NhatKyTheoDoiUpdateManyAndReturnArgs} args - Arguments to update many NhatKyTheoDois.
     * @example
     * // Update many NhatKyTheoDois
     * const nhatKyTheoDoi = await prisma.nhatKyTheoDoi.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more NhatKyTheoDois and only return the `id`
     * const nhatKyTheoDoiWithIdOnly = await prisma.nhatKyTheoDoi.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends NhatKyTheoDoiUpdateManyAndReturnArgs>(args: SelectSubset<T, NhatKyTheoDoiUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NhatKyTheoDoiPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one NhatKyTheoDoi.
     * @param {NhatKyTheoDoiUpsertArgs} args - Arguments to update or create a NhatKyTheoDoi.
     * @example
     * // Update or create a NhatKyTheoDoi
     * const nhatKyTheoDoi = await prisma.nhatKyTheoDoi.upsert({
     *   create: {
     *     // ... data to create a NhatKyTheoDoi
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the NhatKyTheoDoi we want to update
     *   }
     * })
     */
    upsert<T extends NhatKyTheoDoiUpsertArgs>(args: SelectSubset<T, NhatKyTheoDoiUpsertArgs<ExtArgs>>): Prisma__NhatKyTheoDoiClient<$Result.GetResult<Prisma.$NhatKyTheoDoiPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of NhatKyTheoDois.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NhatKyTheoDoiCountArgs} args - Arguments to filter NhatKyTheoDois to count.
     * @example
     * // Count the number of NhatKyTheoDois
     * const count = await prisma.nhatKyTheoDoi.count({
     *   where: {
     *     // ... the filter for the NhatKyTheoDois we want to count
     *   }
     * })
    **/
    count<T extends NhatKyTheoDoiCountArgs>(
      args?: Subset<T, NhatKyTheoDoiCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], NhatKyTheoDoiCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a NhatKyTheoDoi.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NhatKyTheoDoiAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends NhatKyTheoDoiAggregateArgs>(args: Subset<T, NhatKyTheoDoiAggregateArgs>): Prisma.PrismaPromise<GetNhatKyTheoDoiAggregateType<T>>

    /**
     * Group by NhatKyTheoDoi.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NhatKyTheoDoiGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends NhatKyTheoDoiGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: NhatKyTheoDoiGroupByArgs['orderBy'] }
        : { orderBy?: NhatKyTheoDoiGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, NhatKyTheoDoiGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetNhatKyTheoDoiGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the NhatKyTheoDoi model
   */
  readonly fields: NhatKyTheoDoiFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for NhatKyTheoDoi.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__NhatKyTheoDoiClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    hoSo<T extends HoSoBenhNhanDefaultArgs<ExtArgs> = {}>(args?: Subset<T, HoSoBenhNhanDefaultArgs<ExtArgs>>): Prisma__HoSoBenhNhanClient<$Result.GetResult<Prisma.$HoSoBenhNhanPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    nguoiGoi<T extends NguoiDungCSRDefaultArgs<ExtArgs> = {}>(args?: Subset<T, NguoiDungCSRDefaultArgs<ExtArgs>>): Prisma__NguoiDungCSRClient<$Result.GetResult<Prisma.$NguoiDungCSRPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the NhatKyTheoDoi model
   */
  interface NhatKyTheoDoiFieldRefs {
    readonly id: FieldRef<"NhatKyTheoDoi", 'String'>
    readonly hoSoId: FieldRef<"NhatKyTheoDoi", 'String'>
    readonly ngay: FieldRef<"NhatKyTheoDoi", 'DateTime'>
    readonly nguoiGoiMa: FieldRef<"NhatKyTheoDoi", 'String'>
    readonly noiDung: FieldRef<"NhatKyTheoDoi", 'String'>
    readonly syncStatus: FieldRef<"NhatKyTheoDoi", 'String'>
  }
    

  // Custom InputTypes
  /**
   * NhatKyTheoDoi findUnique
   */
  export type NhatKyTheoDoiFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NhatKyTheoDoi
     */
    select?: NhatKyTheoDoiSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NhatKyTheoDoi
     */
    omit?: NhatKyTheoDoiOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NhatKyTheoDoiInclude<ExtArgs> | null
    /**
     * Filter, which NhatKyTheoDoi to fetch.
     */
    where: NhatKyTheoDoiWhereUniqueInput
  }

  /**
   * NhatKyTheoDoi findUniqueOrThrow
   */
  export type NhatKyTheoDoiFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NhatKyTheoDoi
     */
    select?: NhatKyTheoDoiSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NhatKyTheoDoi
     */
    omit?: NhatKyTheoDoiOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NhatKyTheoDoiInclude<ExtArgs> | null
    /**
     * Filter, which NhatKyTheoDoi to fetch.
     */
    where: NhatKyTheoDoiWhereUniqueInput
  }

  /**
   * NhatKyTheoDoi findFirst
   */
  export type NhatKyTheoDoiFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NhatKyTheoDoi
     */
    select?: NhatKyTheoDoiSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NhatKyTheoDoi
     */
    omit?: NhatKyTheoDoiOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NhatKyTheoDoiInclude<ExtArgs> | null
    /**
     * Filter, which NhatKyTheoDoi to fetch.
     */
    where?: NhatKyTheoDoiWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of NhatKyTheoDois to fetch.
     */
    orderBy?: NhatKyTheoDoiOrderByWithRelationInput | NhatKyTheoDoiOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for NhatKyTheoDois.
     */
    cursor?: NhatKyTheoDoiWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` NhatKyTheoDois from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` NhatKyTheoDois.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of NhatKyTheoDois.
     */
    distinct?: NhatKyTheoDoiScalarFieldEnum | NhatKyTheoDoiScalarFieldEnum[]
  }

  /**
   * NhatKyTheoDoi findFirstOrThrow
   */
  export type NhatKyTheoDoiFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NhatKyTheoDoi
     */
    select?: NhatKyTheoDoiSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NhatKyTheoDoi
     */
    omit?: NhatKyTheoDoiOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NhatKyTheoDoiInclude<ExtArgs> | null
    /**
     * Filter, which NhatKyTheoDoi to fetch.
     */
    where?: NhatKyTheoDoiWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of NhatKyTheoDois to fetch.
     */
    orderBy?: NhatKyTheoDoiOrderByWithRelationInput | NhatKyTheoDoiOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for NhatKyTheoDois.
     */
    cursor?: NhatKyTheoDoiWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` NhatKyTheoDois from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` NhatKyTheoDois.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of NhatKyTheoDois.
     */
    distinct?: NhatKyTheoDoiScalarFieldEnum | NhatKyTheoDoiScalarFieldEnum[]
  }

  /**
   * NhatKyTheoDoi findMany
   */
  export type NhatKyTheoDoiFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NhatKyTheoDoi
     */
    select?: NhatKyTheoDoiSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NhatKyTheoDoi
     */
    omit?: NhatKyTheoDoiOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NhatKyTheoDoiInclude<ExtArgs> | null
    /**
     * Filter, which NhatKyTheoDois to fetch.
     */
    where?: NhatKyTheoDoiWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of NhatKyTheoDois to fetch.
     */
    orderBy?: NhatKyTheoDoiOrderByWithRelationInput | NhatKyTheoDoiOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing NhatKyTheoDois.
     */
    cursor?: NhatKyTheoDoiWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` NhatKyTheoDois from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` NhatKyTheoDois.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of NhatKyTheoDois.
     */
    distinct?: NhatKyTheoDoiScalarFieldEnum | NhatKyTheoDoiScalarFieldEnum[]
  }

  /**
   * NhatKyTheoDoi create
   */
  export type NhatKyTheoDoiCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NhatKyTheoDoi
     */
    select?: NhatKyTheoDoiSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NhatKyTheoDoi
     */
    omit?: NhatKyTheoDoiOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NhatKyTheoDoiInclude<ExtArgs> | null
    /**
     * The data needed to create a NhatKyTheoDoi.
     */
    data: XOR<NhatKyTheoDoiCreateInput, NhatKyTheoDoiUncheckedCreateInput>
  }

  /**
   * NhatKyTheoDoi createMany
   */
  export type NhatKyTheoDoiCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many NhatKyTheoDois.
     */
    data: NhatKyTheoDoiCreateManyInput | NhatKyTheoDoiCreateManyInput[]
  }

  /**
   * NhatKyTheoDoi createManyAndReturn
   */
  export type NhatKyTheoDoiCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NhatKyTheoDoi
     */
    select?: NhatKyTheoDoiSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the NhatKyTheoDoi
     */
    omit?: NhatKyTheoDoiOmit<ExtArgs> | null
    /**
     * The data used to create many NhatKyTheoDois.
     */
    data: NhatKyTheoDoiCreateManyInput | NhatKyTheoDoiCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NhatKyTheoDoiIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * NhatKyTheoDoi update
   */
  export type NhatKyTheoDoiUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NhatKyTheoDoi
     */
    select?: NhatKyTheoDoiSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NhatKyTheoDoi
     */
    omit?: NhatKyTheoDoiOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NhatKyTheoDoiInclude<ExtArgs> | null
    /**
     * The data needed to update a NhatKyTheoDoi.
     */
    data: XOR<NhatKyTheoDoiUpdateInput, NhatKyTheoDoiUncheckedUpdateInput>
    /**
     * Choose, which NhatKyTheoDoi to update.
     */
    where: NhatKyTheoDoiWhereUniqueInput
  }

  /**
   * NhatKyTheoDoi updateMany
   */
  export type NhatKyTheoDoiUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update NhatKyTheoDois.
     */
    data: XOR<NhatKyTheoDoiUpdateManyMutationInput, NhatKyTheoDoiUncheckedUpdateManyInput>
    /**
     * Filter which NhatKyTheoDois to update
     */
    where?: NhatKyTheoDoiWhereInput
    /**
     * Limit how many NhatKyTheoDois to update.
     */
    limit?: number
  }

  /**
   * NhatKyTheoDoi updateManyAndReturn
   */
  export type NhatKyTheoDoiUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NhatKyTheoDoi
     */
    select?: NhatKyTheoDoiSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the NhatKyTheoDoi
     */
    omit?: NhatKyTheoDoiOmit<ExtArgs> | null
    /**
     * The data used to update NhatKyTheoDois.
     */
    data: XOR<NhatKyTheoDoiUpdateManyMutationInput, NhatKyTheoDoiUncheckedUpdateManyInput>
    /**
     * Filter which NhatKyTheoDois to update
     */
    where?: NhatKyTheoDoiWhereInput
    /**
     * Limit how many NhatKyTheoDois to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NhatKyTheoDoiIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * NhatKyTheoDoi upsert
   */
  export type NhatKyTheoDoiUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NhatKyTheoDoi
     */
    select?: NhatKyTheoDoiSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NhatKyTheoDoi
     */
    omit?: NhatKyTheoDoiOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NhatKyTheoDoiInclude<ExtArgs> | null
    /**
     * The filter to search for the NhatKyTheoDoi to update in case it exists.
     */
    where: NhatKyTheoDoiWhereUniqueInput
    /**
     * In case the NhatKyTheoDoi found by the `where` argument doesn't exist, create a new NhatKyTheoDoi with this data.
     */
    create: XOR<NhatKyTheoDoiCreateInput, NhatKyTheoDoiUncheckedCreateInput>
    /**
     * In case the NhatKyTheoDoi was found with the provided `where` argument, update it with this data.
     */
    update: XOR<NhatKyTheoDoiUpdateInput, NhatKyTheoDoiUncheckedUpdateInput>
  }

  /**
   * NhatKyTheoDoi delete
   */
  export type NhatKyTheoDoiDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NhatKyTheoDoi
     */
    select?: NhatKyTheoDoiSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NhatKyTheoDoi
     */
    omit?: NhatKyTheoDoiOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NhatKyTheoDoiInclude<ExtArgs> | null
    /**
     * Filter which NhatKyTheoDoi to delete.
     */
    where: NhatKyTheoDoiWhereUniqueInput
  }

  /**
   * NhatKyTheoDoi deleteMany
   */
  export type NhatKyTheoDoiDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which NhatKyTheoDois to delete
     */
    where?: NhatKyTheoDoiWhereInput
    /**
     * Limit how many NhatKyTheoDois to delete.
     */
    limit?: number
  }

  /**
   * NhatKyTheoDoi without action
   */
  export type NhatKyTheoDoiDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NhatKyTheoDoi
     */
    select?: NhatKyTheoDoiSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NhatKyTheoDoi
     */
    omit?: NhatKyTheoDoiOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NhatKyTheoDoiInclude<ExtArgs> | null
  }


  /**
   * Model AuditLog
   */

  export type AggregateAuditLog = {
    _count: AuditLogCountAggregateOutputType | null
    _avg: AuditLogAvgAggregateOutputType | null
    _sum: AuditLogSumAggregateOutputType | null
    _min: AuditLogMinAggregateOutputType | null
    _max: AuditLogMaxAggregateOutputType | null
  }

  export type AuditLogAvgAggregateOutputType = {
    id: number | null
  }

  export type AuditLogSumAggregateOutputType = {
    id: number | null
  }

  export type AuditLogMinAggregateOutputType = {
    id: number | null
    bang: string | null
    banGhiId: string | null
    hanhDong: string | null
    nguoiDung: string | null
    thoiDiem: Date | null
    thayDoi: string | null
  }

  export type AuditLogMaxAggregateOutputType = {
    id: number | null
    bang: string | null
    banGhiId: string | null
    hanhDong: string | null
    nguoiDung: string | null
    thoiDiem: Date | null
    thayDoi: string | null
  }

  export type AuditLogCountAggregateOutputType = {
    id: number
    bang: number
    banGhiId: number
    hanhDong: number
    nguoiDung: number
    thoiDiem: number
    thayDoi: number
    _all: number
  }


  export type AuditLogAvgAggregateInputType = {
    id?: true
  }

  export type AuditLogSumAggregateInputType = {
    id?: true
  }

  export type AuditLogMinAggregateInputType = {
    id?: true
    bang?: true
    banGhiId?: true
    hanhDong?: true
    nguoiDung?: true
    thoiDiem?: true
    thayDoi?: true
  }

  export type AuditLogMaxAggregateInputType = {
    id?: true
    bang?: true
    banGhiId?: true
    hanhDong?: true
    nguoiDung?: true
    thoiDiem?: true
    thayDoi?: true
  }

  export type AuditLogCountAggregateInputType = {
    id?: true
    bang?: true
    banGhiId?: true
    hanhDong?: true
    nguoiDung?: true
    thoiDiem?: true
    thayDoi?: true
    _all?: true
  }

  export type AuditLogAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AuditLog to aggregate.
     */
    where?: AuditLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AuditLogs to fetch.
     */
    orderBy?: AuditLogOrderByWithRelationInput | AuditLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AuditLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AuditLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AuditLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned AuditLogs
    **/
    _count?: true | AuditLogCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: AuditLogAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: AuditLogSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AuditLogMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AuditLogMaxAggregateInputType
  }

  export type GetAuditLogAggregateType<T extends AuditLogAggregateArgs> = {
        [P in keyof T & keyof AggregateAuditLog]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAuditLog[P]>
      : GetScalarType<T[P], AggregateAuditLog[P]>
  }




  export type AuditLogGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AuditLogWhereInput
    orderBy?: AuditLogOrderByWithAggregationInput | AuditLogOrderByWithAggregationInput[]
    by: AuditLogScalarFieldEnum[] | AuditLogScalarFieldEnum
    having?: AuditLogScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AuditLogCountAggregateInputType | true
    _avg?: AuditLogAvgAggregateInputType
    _sum?: AuditLogSumAggregateInputType
    _min?: AuditLogMinAggregateInputType
    _max?: AuditLogMaxAggregateInputType
  }

  export type AuditLogGroupByOutputType = {
    id: number
    bang: string
    banGhiId: string
    hanhDong: string
    nguoiDung: string
    thoiDiem: Date
    thayDoi: string
    _count: AuditLogCountAggregateOutputType | null
    _avg: AuditLogAvgAggregateOutputType | null
    _sum: AuditLogSumAggregateOutputType | null
    _min: AuditLogMinAggregateOutputType | null
    _max: AuditLogMaxAggregateOutputType | null
  }

  type GetAuditLogGroupByPayload<T extends AuditLogGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AuditLogGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AuditLogGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AuditLogGroupByOutputType[P]>
            : GetScalarType<T[P], AuditLogGroupByOutputType[P]>
        }
      >
    >


  export type AuditLogSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    bang?: boolean
    banGhiId?: boolean
    hanhDong?: boolean
    nguoiDung?: boolean
    thoiDiem?: boolean
    thayDoi?: boolean
  }, ExtArgs["result"]["auditLog"]>

  export type AuditLogSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    bang?: boolean
    banGhiId?: boolean
    hanhDong?: boolean
    nguoiDung?: boolean
    thoiDiem?: boolean
    thayDoi?: boolean
  }, ExtArgs["result"]["auditLog"]>

  export type AuditLogSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    bang?: boolean
    banGhiId?: boolean
    hanhDong?: boolean
    nguoiDung?: boolean
    thoiDiem?: boolean
    thayDoi?: boolean
  }, ExtArgs["result"]["auditLog"]>

  export type AuditLogSelectScalar = {
    id?: boolean
    bang?: boolean
    banGhiId?: boolean
    hanhDong?: boolean
    nguoiDung?: boolean
    thoiDiem?: boolean
    thayDoi?: boolean
  }

  export type AuditLogOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "bang" | "banGhiId" | "hanhDong" | "nguoiDung" | "thoiDiem" | "thayDoi", ExtArgs["result"]["auditLog"]>

  export type $AuditLogPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "AuditLog"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: number
      bang: string
      banGhiId: string
      hanhDong: string
      nguoiDung: string
      thoiDiem: Date
      thayDoi: string
    }, ExtArgs["result"]["auditLog"]>
    composites: {}
  }

  type AuditLogGetPayload<S extends boolean | null | undefined | AuditLogDefaultArgs> = $Result.GetResult<Prisma.$AuditLogPayload, S>

  type AuditLogCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AuditLogFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AuditLogCountAggregateInputType | true
    }

  export interface AuditLogDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['AuditLog'], meta: { name: 'AuditLog' } }
    /**
     * Find zero or one AuditLog that matches the filter.
     * @param {AuditLogFindUniqueArgs} args - Arguments to find a AuditLog
     * @example
     * // Get one AuditLog
     * const auditLog = await prisma.auditLog.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AuditLogFindUniqueArgs>(args: SelectSubset<T, AuditLogFindUniqueArgs<ExtArgs>>): Prisma__AuditLogClient<$Result.GetResult<Prisma.$AuditLogPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one AuditLog that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AuditLogFindUniqueOrThrowArgs} args - Arguments to find a AuditLog
     * @example
     * // Get one AuditLog
     * const auditLog = await prisma.auditLog.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AuditLogFindUniqueOrThrowArgs>(args: SelectSubset<T, AuditLogFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AuditLogClient<$Result.GetResult<Prisma.$AuditLogPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first AuditLog that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuditLogFindFirstArgs} args - Arguments to find a AuditLog
     * @example
     * // Get one AuditLog
     * const auditLog = await prisma.auditLog.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AuditLogFindFirstArgs>(args?: SelectSubset<T, AuditLogFindFirstArgs<ExtArgs>>): Prisma__AuditLogClient<$Result.GetResult<Prisma.$AuditLogPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first AuditLog that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuditLogFindFirstOrThrowArgs} args - Arguments to find a AuditLog
     * @example
     * // Get one AuditLog
     * const auditLog = await prisma.auditLog.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AuditLogFindFirstOrThrowArgs>(args?: SelectSubset<T, AuditLogFindFirstOrThrowArgs<ExtArgs>>): Prisma__AuditLogClient<$Result.GetResult<Prisma.$AuditLogPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more AuditLogs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuditLogFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all AuditLogs
     * const auditLogs = await prisma.auditLog.findMany()
     * 
     * // Get first 10 AuditLogs
     * const auditLogs = await prisma.auditLog.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const auditLogWithIdOnly = await prisma.auditLog.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AuditLogFindManyArgs>(args?: SelectSubset<T, AuditLogFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AuditLogPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a AuditLog.
     * @param {AuditLogCreateArgs} args - Arguments to create a AuditLog.
     * @example
     * // Create one AuditLog
     * const AuditLog = await prisma.auditLog.create({
     *   data: {
     *     // ... data to create a AuditLog
     *   }
     * })
     * 
     */
    create<T extends AuditLogCreateArgs>(args: SelectSubset<T, AuditLogCreateArgs<ExtArgs>>): Prisma__AuditLogClient<$Result.GetResult<Prisma.$AuditLogPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many AuditLogs.
     * @param {AuditLogCreateManyArgs} args - Arguments to create many AuditLogs.
     * @example
     * // Create many AuditLogs
     * const auditLog = await prisma.auditLog.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AuditLogCreateManyArgs>(args?: SelectSubset<T, AuditLogCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many AuditLogs and returns the data saved in the database.
     * @param {AuditLogCreateManyAndReturnArgs} args - Arguments to create many AuditLogs.
     * @example
     * // Create many AuditLogs
     * const auditLog = await prisma.auditLog.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many AuditLogs and only return the `id`
     * const auditLogWithIdOnly = await prisma.auditLog.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AuditLogCreateManyAndReturnArgs>(args?: SelectSubset<T, AuditLogCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AuditLogPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a AuditLog.
     * @param {AuditLogDeleteArgs} args - Arguments to delete one AuditLog.
     * @example
     * // Delete one AuditLog
     * const AuditLog = await prisma.auditLog.delete({
     *   where: {
     *     // ... filter to delete one AuditLog
     *   }
     * })
     * 
     */
    delete<T extends AuditLogDeleteArgs>(args: SelectSubset<T, AuditLogDeleteArgs<ExtArgs>>): Prisma__AuditLogClient<$Result.GetResult<Prisma.$AuditLogPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one AuditLog.
     * @param {AuditLogUpdateArgs} args - Arguments to update one AuditLog.
     * @example
     * // Update one AuditLog
     * const auditLog = await prisma.auditLog.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AuditLogUpdateArgs>(args: SelectSubset<T, AuditLogUpdateArgs<ExtArgs>>): Prisma__AuditLogClient<$Result.GetResult<Prisma.$AuditLogPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more AuditLogs.
     * @param {AuditLogDeleteManyArgs} args - Arguments to filter AuditLogs to delete.
     * @example
     * // Delete a few AuditLogs
     * const { count } = await prisma.auditLog.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AuditLogDeleteManyArgs>(args?: SelectSubset<T, AuditLogDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AuditLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuditLogUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many AuditLogs
     * const auditLog = await prisma.auditLog.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AuditLogUpdateManyArgs>(args: SelectSubset<T, AuditLogUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AuditLogs and returns the data updated in the database.
     * @param {AuditLogUpdateManyAndReturnArgs} args - Arguments to update many AuditLogs.
     * @example
     * // Update many AuditLogs
     * const auditLog = await prisma.auditLog.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more AuditLogs and only return the `id`
     * const auditLogWithIdOnly = await prisma.auditLog.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends AuditLogUpdateManyAndReturnArgs>(args: SelectSubset<T, AuditLogUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AuditLogPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one AuditLog.
     * @param {AuditLogUpsertArgs} args - Arguments to update or create a AuditLog.
     * @example
     * // Update or create a AuditLog
     * const auditLog = await prisma.auditLog.upsert({
     *   create: {
     *     // ... data to create a AuditLog
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the AuditLog we want to update
     *   }
     * })
     */
    upsert<T extends AuditLogUpsertArgs>(args: SelectSubset<T, AuditLogUpsertArgs<ExtArgs>>): Prisma__AuditLogClient<$Result.GetResult<Prisma.$AuditLogPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of AuditLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuditLogCountArgs} args - Arguments to filter AuditLogs to count.
     * @example
     * // Count the number of AuditLogs
     * const count = await prisma.auditLog.count({
     *   where: {
     *     // ... the filter for the AuditLogs we want to count
     *   }
     * })
    **/
    count<T extends AuditLogCountArgs>(
      args?: Subset<T, AuditLogCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AuditLogCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a AuditLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuditLogAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AuditLogAggregateArgs>(args: Subset<T, AuditLogAggregateArgs>): Prisma.PrismaPromise<GetAuditLogAggregateType<T>>

    /**
     * Group by AuditLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuditLogGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AuditLogGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AuditLogGroupByArgs['orderBy'] }
        : { orderBy?: AuditLogGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AuditLogGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAuditLogGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the AuditLog model
   */
  readonly fields: AuditLogFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for AuditLog.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AuditLogClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the AuditLog model
   */
  interface AuditLogFieldRefs {
    readonly id: FieldRef<"AuditLog", 'Int'>
    readonly bang: FieldRef<"AuditLog", 'String'>
    readonly banGhiId: FieldRef<"AuditLog", 'String'>
    readonly hanhDong: FieldRef<"AuditLog", 'String'>
    readonly nguoiDung: FieldRef<"AuditLog", 'String'>
    readonly thoiDiem: FieldRef<"AuditLog", 'DateTime'>
    readonly thayDoi: FieldRef<"AuditLog", 'String'>
  }
    

  // Custom InputTypes
  /**
   * AuditLog findUnique
   */
  export type AuditLogFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
    /**
     * Filter, which AuditLog to fetch.
     */
    where: AuditLogWhereUniqueInput
  }

  /**
   * AuditLog findUniqueOrThrow
   */
  export type AuditLogFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
    /**
     * Filter, which AuditLog to fetch.
     */
    where: AuditLogWhereUniqueInput
  }

  /**
   * AuditLog findFirst
   */
  export type AuditLogFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
    /**
     * Filter, which AuditLog to fetch.
     */
    where?: AuditLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AuditLogs to fetch.
     */
    orderBy?: AuditLogOrderByWithRelationInput | AuditLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AuditLogs.
     */
    cursor?: AuditLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AuditLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AuditLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AuditLogs.
     */
    distinct?: AuditLogScalarFieldEnum | AuditLogScalarFieldEnum[]
  }

  /**
   * AuditLog findFirstOrThrow
   */
  export type AuditLogFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
    /**
     * Filter, which AuditLog to fetch.
     */
    where?: AuditLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AuditLogs to fetch.
     */
    orderBy?: AuditLogOrderByWithRelationInput | AuditLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AuditLogs.
     */
    cursor?: AuditLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AuditLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AuditLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AuditLogs.
     */
    distinct?: AuditLogScalarFieldEnum | AuditLogScalarFieldEnum[]
  }

  /**
   * AuditLog findMany
   */
  export type AuditLogFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
    /**
     * Filter, which AuditLogs to fetch.
     */
    where?: AuditLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AuditLogs to fetch.
     */
    orderBy?: AuditLogOrderByWithRelationInput | AuditLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing AuditLogs.
     */
    cursor?: AuditLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AuditLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AuditLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AuditLogs.
     */
    distinct?: AuditLogScalarFieldEnum | AuditLogScalarFieldEnum[]
  }

  /**
   * AuditLog create
   */
  export type AuditLogCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
    /**
     * The data needed to create a AuditLog.
     */
    data: XOR<AuditLogCreateInput, AuditLogUncheckedCreateInput>
  }

  /**
   * AuditLog createMany
   */
  export type AuditLogCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many AuditLogs.
     */
    data: AuditLogCreateManyInput | AuditLogCreateManyInput[]
  }

  /**
   * AuditLog createManyAndReturn
   */
  export type AuditLogCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
    /**
     * The data used to create many AuditLogs.
     */
    data: AuditLogCreateManyInput | AuditLogCreateManyInput[]
  }

  /**
   * AuditLog update
   */
  export type AuditLogUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
    /**
     * The data needed to update a AuditLog.
     */
    data: XOR<AuditLogUpdateInput, AuditLogUncheckedUpdateInput>
    /**
     * Choose, which AuditLog to update.
     */
    where: AuditLogWhereUniqueInput
  }

  /**
   * AuditLog updateMany
   */
  export type AuditLogUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update AuditLogs.
     */
    data: XOR<AuditLogUpdateManyMutationInput, AuditLogUncheckedUpdateManyInput>
    /**
     * Filter which AuditLogs to update
     */
    where?: AuditLogWhereInput
    /**
     * Limit how many AuditLogs to update.
     */
    limit?: number
  }

  /**
   * AuditLog updateManyAndReturn
   */
  export type AuditLogUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
    /**
     * The data used to update AuditLogs.
     */
    data: XOR<AuditLogUpdateManyMutationInput, AuditLogUncheckedUpdateManyInput>
    /**
     * Filter which AuditLogs to update
     */
    where?: AuditLogWhereInput
    /**
     * Limit how many AuditLogs to update.
     */
    limit?: number
  }

  /**
   * AuditLog upsert
   */
  export type AuditLogUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
    /**
     * The filter to search for the AuditLog to update in case it exists.
     */
    where: AuditLogWhereUniqueInput
    /**
     * In case the AuditLog found by the `where` argument doesn't exist, create a new AuditLog with this data.
     */
    create: XOR<AuditLogCreateInput, AuditLogUncheckedCreateInput>
    /**
     * In case the AuditLog was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AuditLogUpdateInput, AuditLogUncheckedUpdateInput>
  }

  /**
   * AuditLog delete
   */
  export type AuditLogDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
    /**
     * Filter which AuditLog to delete.
     */
    where: AuditLogWhereUniqueInput
  }

  /**
   * AuditLog deleteMany
   */
  export type AuditLogDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AuditLogs to delete
     */
    where?: AuditLogWhereInput
    /**
     * Limit how many AuditLogs to delete.
     */
    limit?: number
  }

  /**
   * AuditLog without action
   */
  export type AuditLogDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
  }


  /**
   * Model SyncQueue
   */

  export type AggregateSyncQueue = {
    _count: SyncQueueCountAggregateOutputType | null
    _avg: SyncQueueAvgAggregateOutputType | null
    _sum: SyncQueueSumAggregateOutputType | null
    _min: SyncQueueMinAggregateOutputType | null
    _max: SyncQueueMaxAggregateOutputType | null
  }

  export type SyncQueueAvgAggregateOutputType = {
    id: number | null
    retries: number | null
  }

  export type SyncQueueSumAggregateOutputType = {
    id: number | null
    retries: number | null
  }

  export type SyncQueueMinAggregateOutputType = {
    id: number | null
    hoSoId: string | null
    createdAt: Date | null
    retries: number | null
  }

  export type SyncQueueMaxAggregateOutputType = {
    id: number | null
    hoSoId: string | null
    createdAt: Date | null
    retries: number | null
  }

  export type SyncQueueCountAggregateOutputType = {
    id: number
    hoSoId: number
    createdAt: number
    retries: number
    _all: number
  }


  export type SyncQueueAvgAggregateInputType = {
    id?: true
    retries?: true
  }

  export type SyncQueueSumAggregateInputType = {
    id?: true
    retries?: true
  }

  export type SyncQueueMinAggregateInputType = {
    id?: true
    hoSoId?: true
    createdAt?: true
    retries?: true
  }

  export type SyncQueueMaxAggregateInputType = {
    id?: true
    hoSoId?: true
    createdAt?: true
    retries?: true
  }

  export type SyncQueueCountAggregateInputType = {
    id?: true
    hoSoId?: true
    createdAt?: true
    retries?: true
    _all?: true
  }

  export type SyncQueueAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SyncQueue to aggregate.
     */
    where?: SyncQueueWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SyncQueues to fetch.
     */
    orderBy?: SyncQueueOrderByWithRelationInput | SyncQueueOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SyncQueueWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SyncQueues from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SyncQueues.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SyncQueues
    **/
    _count?: true | SyncQueueCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: SyncQueueAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: SyncQueueSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SyncQueueMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SyncQueueMaxAggregateInputType
  }

  export type GetSyncQueueAggregateType<T extends SyncQueueAggregateArgs> = {
        [P in keyof T & keyof AggregateSyncQueue]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSyncQueue[P]>
      : GetScalarType<T[P], AggregateSyncQueue[P]>
  }




  export type SyncQueueGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SyncQueueWhereInput
    orderBy?: SyncQueueOrderByWithAggregationInput | SyncQueueOrderByWithAggregationInput[]
    by: SyncQueueScalarFieldEnum[] | SyncQueueScalarFieldEnum
    having?: SyncQueueScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SyncQueueCountAggregateInputType | true
    _avg?: SyncQueueAvgAggregateInputType
    _sum?: SyncQueueSumAggregateInputType
    _min?: SyncQueueMinAggregateInputType
    _max?: SyncQueueMaxAggregateInputType
  }

  export type SyncQueueGroupByOutputType = {
    id: number
    hoSoId: string
    createdAt: Date
    retries: number
    _count: SyncQueueCountAggregateOutputType | null
    _avg: SyncQueueAvgAggregateOutputType | null
    _sum: SyncQueueSumAggregateOutputType | null
    _min: SyncQueueMinAggregateOutputType | null
    _max: SyncQueueMaxAggregateOutputType | null
  }

  type GetSyncQueueGroupByPayload<T extends SyncQueueGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SyncQueueGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SyncQueueGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SyncQueueGroupByOutputType[P]>
            : GetScalarType<T[P], SyncQueueGroupByOutputType[P]>
        }
      >
    >


  export type SyncQueueSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    hoSoId?: boolean
    createdAt?: boolean
    retries?: boolean
  }, ExtArgs["result"]["syncQueue"]>

  export type SyncQueueSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    hoSoId?: boolean
    createdAt?: boolean
    retries?: boolean
  }, ExtArgs["result"]["syncQueue"]>

  export type SyncQueueSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    hoSoId?: boolean
    createdAt?: boolean
    retries?: boolean
  }, ExtArgs["result"]["syncQueue"]>

  export type SyncQueueSelectScalar = {
    id?: boolean
    hoSoId?: boolean
    createdAt?: boolean
    retries?: boolean
  }

  export type SyncQueueOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "hoSoId" | "createdAt" | "retries", ExtArgs["result"]["syncQueue"]>

  export type $SyncQueuePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SyncQueue"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: number
      hoSoId: string
      createdAt: Date
      retries: number
    }, ExtArgs["result"]["syncQueue"]>
    composites: {}
  }

  type SyncQueueGetPayload<S extends boolean | null | undefined | SyncQueueDefaultArgs> = $Result.GetResult<Prisma.$SyncQueuePayload, S>

  type SyncQueueCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SyncQueueFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SyncQueueCountAggregateInputType | true
    }

  export interface SyncQueueDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SyncQueue'], meta: { name: 'SyncQueue' } }
    /**
     * Find zero or one SyncQueue that matches the filter.
     * @param {SyncQueueFindUniqueArgs} args - Arguments to find a SyncQueue
     * @example
     * // Get one SyncQueue
     * const syncQueue = await prisma.syncQueue.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SyncQueueFindUniqueArgs>(args: SelectSubset<T, SyncQueueFindUniqueArgs<ExtArgs>>): Prisma__SyncQueueClient<$Result.GetResult<Prisma.$SyncQueuePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one SyncQueue that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SyncQueueFindUniqueOrThrowArgs} args - Arguments to find a SyncQueue
     * @example
     * // Get one SyncQueue
     * const syncQueue = await prisma.syncQueue.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SyncQueueFindUniqueOrThrowArgs>(args: SelectSubset<T, SyncQueueFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SyncQueueClient<$Result.GetResult<Prisma.$SyncQueuePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first SyncQueue that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SyncQueueFindFirstArgs} args - Arguments to find a SyncQueue
     * @example
     * // Get one SyncQueue
     * const syncQueue = await prisma.syncQueue.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SyncQueueFindFirstArgs>(args?: SelectSubset<T, SyncQueueFindFirstArgs<ExtArgs>>): Prisma__SyncQueueClient<$Result.GetResult<Prisma.$SyncQueuePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first SyncQueue that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SyncQueueFindFirstOrThrowArgs} args - Arguments to find a SyncQueue
     * @example
     * // Get one SyncQueue
     * const syncQueue = await prisma.syncQueue.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SyncQueueFindFirstOrThrowArgs>(args?: SelectSubset<T, SyncQueueFindFirstOrThrowArgs<ExtArgs>>): Prisma__SyncQueueClient<$Result.GetResult<Prisma.$SyncQueuePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more SyncQueues that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SyncQueueFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SyncQueues
     * const syncQueues = await prisma.syncQueue.findMany()
     * 
     * // Get first 10 SyncQueues
     * const syncQueues = await prisma.syncQueue.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const syncQueueWithIdOnly = await prisma.syncQueue.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SyncQueueFindManyArgs>(args?: SelectSubset<T, SyncQueueFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SyncQueuePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a SyncQueue.
     * @param {SyncQueueCreateArgs} args - Arguments to create a SyncQueue.
     * @example
     * // Create one SyncQueue
     * const SyncQueue = await prisma.syncQueue.create({
     *   data: {
     *     // ... data to create a SyncQueue
     *   }
     * })
     * 
     */
    create<T extends SyncQueueCreateArgs>(args: SelectSubset<T, SyncQueueCreateArgs<ExtArgs>>): Prisma__SyncQueueClient<$Result.GetResult<Prisma.$SyncQueuePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many SyncQueues.
     * @param {SyncQueueCreateManyArgs} args - Arguments to create many SyncQueues.
     * @example
     * // Create many SyncQueues
     * const syncQueue = await prisma.syncQueue.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SyncQueueCreateManyArgs>(args?: SelectSubset<T, SyncQueueCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SyncQueues and returns the data saved in the database.
     * @param {SyncQueueCreateManyAndReturnArgs} args - Arguments to create many SyncQueues.
     * @example
     * // Create many SyncQueues
     * const syncQueue = await prisma.syncQueue.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SyncQueues and only return the `id`
     * const syncQueueWithIdOnly = await prisma.syncQueue.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SyncQueueCreateManyAndReturnArgs>(args?: SelectSubset<T, SyncQueueCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SyncQueuePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a SyncQueue.
     * @param {SyncQueueDeleteArgs} args - Arguments to delete one SyncQueue.
     * @example
     * // Delete one SyncQueue
     * const SyncQueue = await prisma.syncQueue.delete({
     *   where: {
     *     // ... filter to delete one SyncQueue
     *   }
     * })
     * 
     */
    delete<T extends SyncQueueDeleteArgs>(args: SelectSubset<T, SyncQueueDeleteArgs<ExtArgs>>): Prisma__SyncQueueClient<$Result.GetResult<Prisma.$SyncQueuePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one SyncQueue.
     * @param {SyncQueueUpdateArgs} args - Arguments to update one SyncQueue.
     * @example
     * // Update one SyncQueue
     * const syncQueue = await prisma.syncQueue.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SyncQueueUpdateArgs>(args: SelectSubset<T, SyncQueueUpdateArgs<ExtArgs>>): Prisma__SyncQueueClient<$Result.GetResult<Prisma.$SyncQueuePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more SyncQueues.
     * @param {SyncQueueDeleteManyArgs} args - Arguments to filter SyncQueues to delete.
     * @example
     * // Delete a few SyncQueues
     * const { count } = await prisma.syncQueue.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SyncQueueDeleteManyArgs>(args?: SelectSubset<T, SyncQueueDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SyncQueues.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SyncQueueUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SyncQueues
     * const syncQueue = await prisma.syncQueue.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SyncQueueUpdateManyArgs>(args: SelectSubset<T, SyncQueueUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SyncQueues and returns the data updated in the database.
     * @param {SyncQueueUpdateManyAndReturnArgs} args - Arguments to update many SyncQueues.
     * @example
     * // Update many SyncQueues
     * const syncQueue = await prisma.syncQueue.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more SyncQueues and only return the `id`
     * const syncQueueWithIdOnly = await prisma.syncQueue.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SyncQueueUpdateManyAndReturnArgs>(args: SelectSubset<T, SyncQueueUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SyncQueuePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one SyncQueue.
     * @param {SyncQueueUpsertArgs} args - Arguments to update or create a SyncQueue.
     * @example
     * // Update or create a SyncQueue
     * const syncQueue = await prisma.syncQueue.upsert({
     *   create: {
     *     // ... data to create a SyncQueue
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SyncQueue we want to update
     *   }
     * })
     */
    upsert<T extends SyncQueueUpsertArgs>(args: SelectSubset<T, SyncQueueUpsertArgs<ExtArgs>>): Prisma__SyncQueueClient<$Result.GetResult<Prisma.$SyncQueuePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of SyncQueues.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SyncQueueCountArgs} args - Arguments to filter SyncQueues to count.
     * @example
     * // Count the number of SyncQueues
     * const count = await prisma.syncQueue.count({
     *   where: {
     *     // ... the filter for the SyncQueues we want to count
     *   }
     * })
    **/
    count<T extends SyncQueueCountArgs>(
      args?: Subset<T, SyncQueueCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SyncQueueCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SyncQueue.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SyncQueueAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SyncQueueAggregateArgs>(args: Subset<T, SyncQueueAggregateArgs>): Prisma.PrismaPromise<GetSyncQueueAggregateType<T>>

    /**
     * Group by SyncQueue.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SyncQueueGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SyncQueueGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SyncQueueGroupByArgs['orderBy'] }
        : { orderBy?: SyncQueueGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SyncQueueGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSyncQueueGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SyncQueue model
   */
  readonly fields: SyncQueueFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SyncQueue.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SyncQueueClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the SyncQueue model
   */
  interface SyncQueueFieldRefs {
    readonly id: FieldRef<"SyncQueue", 'Int'>
    readonly hoSoId: FieldRef<"SyncQueue", 'String'>
    readonly createdAt: FieldRef<"SyncQueue", 'DateTime'>
    readonly retries: FieldRef<"SyncQueue", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * SyncQueue findUnique
   */
  export type SyncQueueFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncQueue
     */
    select?: SyncQueueSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SyncQueue
     */
    omit?: SyncQueueOmit<ExtArgs> | null
    /**
     * Filter, which SyncQueue to fetch.
     */
    where: SyncQueueWhereUniqueInput
  }

  /**
   * SyncQueue findUniqueOrThrow
   */
  export type SyncQueueFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncQueue
     */
    select?: SyncQueueSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SyncQueue
     */
    omit?: SyncQueueOmit<ExtArgs> | null
    /**
     * Filter, which SyncQueue to fetch.
     */
    where: SyncQueueWhereUniqueInput
  }

  /**
   * SyncQueue findFirst
   */
  export type SyncQueueFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncQueue
     */
    select?: SyncQueueSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SyncQueue
     */
    omit?: SyncQueueOmit<ExtArgs> | null
    /**
     * Filter, which SyncQueue to fetch.
     */
    where?: SyncQueueWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SyncQueues to fetch.
     */
    orderBy?: SyncQueueOrderByWithRelationInput | SyncQueueOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SyncQueues.
     */
    cursor?: SyncQueueWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SyncQueues from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SyncQueues.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SyncQueues.
     */
    distinct?: SyncQueueScalarFieldEnum | SyncQueueScalarFieldEnum[]
  }

  /**
   * SyncQueue findFirstOrThrow
   */
  export type SyncQueueFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncQueue
     */
    select?: SyncQueueSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SyncQueue
     */
    omit?: SyncQueueOmit<ExtArgs> | null
    /**
     * Filter, which SyncQueue to fetch.
     */
    where?: SyncQueueWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SyncQueues to fetch.
     */
    orderBy?: SyncQueueOrderByWithRelationInput | SyncQueueOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SyncQueues.
     */
    cursor?: SyncQueueWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SyncQueues from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SyncQueues.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SyncQueues.
     */
    distinct?: SyncQueueScalarFieldEnum | SyncQueueScalarFieldEnum[]
  }

  /**
   * SyncQueue findMany
   */
  export type SyncQueueFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncQueue
     */
    select?: SyncQueueSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SyncQueue
     */
    omit?: SyncQueueOmit<ExtArgs> | null
    /**
     * Filter, which SyncQueues to fetch.
     */
    where?: SyncQueueWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SyncQueues to fetch.
     */
    orderBy?: SyncQueueOrderByWithRelationInput | SyncQueueOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SyncQueues.
     */
    cursor?: SyncQueueWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SyncQueues from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SyncQueues.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SyncQueues.
     */
    distinct?: SyncQueueScalarFieldEnum | SyncQueueScalarFieldEnum[]
  }

  /**
   * SyncQueue create
   */
  export type SyncQueueCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncQueue
     */
    select?: SyncQueueSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SyncQueue
     */
    omit?: SyncQueueOmit<ExtArgs> | null
    /**
     * The data needed to create a SyncQueue.
     */
    data: XOR<SyncQueueCreateInput, SyncQueueUncheckedCreateInput>
  }

  /**
   * SyncQueue createMany
   */
  export type SyncQueueCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SyncQueues.
     */
    data: SyncQueueCreateManyInput | SyncQueueCreateManyInput[]
  }

  /**
   * SyncQueue createManyAndReturn
   */
  export type SyncQueueCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncQueue
     */
    select?: SyncQueueSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SyncQueue
     */
    omit?: SyncQueueOmit<ExtArgs> | null
    /**
     * The data used to create many SyncQueues.
     */
    data: SyncQueueCreateManyInput | SyncQueueCreateManyInput[]
  }

  /**
   * SyncQueue update
   */
  export type SyncQueueUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncQueue
     */
    select?: SyncQueueSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SyncQueue
     */
    omit?: SyncQueueOmit<ExtArgs> | null
    /**
     * The data needed to update a SyncQueue.
     */
    data: XOR<SyncQueueUpdateInput, SyncQueueUncheckedUpdateInput>
    /**
     * Choose, which SyncQueue to update.
     */
    where: SyncQueueWhereUniqueInput
  }

  /**
   * SyncQueue updateMany
   */
  export type SyncQueueUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SyncQueues.
     */
    data: XOR<SyncQueueUpdateManyMutationInput, SyncQueueUncheckedUpdateManyInput>
    /**
     * Filter which SyncQueues to update
     */
    where?: SyncQueueWhereInput
    /**
     * Limit how many SyncQueues to update.
     */
    limit?: number
  }

  /**
   * SyncQueue updateManyAndReturn
   */
  export type SyncQueueUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncQueue
     */
    select?: SyncQueueSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SyncQueue
     */
    omit?: SyncQueueOmit<ExtArgs> | null
    /**
     * The data used to update SyncQueues.
     */
    data: XOR<SyncQueueUpdateManyMutationInput, SyncQueueUncheckedUpdateManyInput>
    /**
     * Filter which SyncQueues to update
     */
    where?: SyncQueueWhereInput
    /**
     * Limit how many SyncQueues to update.
     */
    limit?: number
  }

  /**
   * SyncQueue upsert
   */
  export type SyncQueueUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncQueue
     */
    select?: SyncQueueSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SyncQueue
     */
    omit?: SyncQueueOmit<ExtArgs> | null
    /**
     * The filter to search for the SyncQueue to update in case it exists.
     */
    where: SyncQueueWhereUniqueInput
    /**
     * In case the SyncQueue found by the `where` argument doesn't exist, create a new SyncQueue with this data.
     */
    create: XOR<SyncQueueCreateInput, SyncQueueUncheckedCreateInput>
    /**
     * In case the SyncQueue was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SyncQueueUpdateInput, SyncQueueUncheckedUpdateInput>
  }

  /**
   * SyncQueue delete
   */
  export type SyncQueueDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncQueue
     */
    select?: SyncQueueSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SyncQueue
     */
    omit?: SyncQueueOmit<ExtArgs> | null
    /**
     * Filter which SyncQueue to delete.
     */
    where: SyncQueueWhereUniqueInput
  }

  /**
   * SyncQueue deleteMany
   */
  export type SyncQueueDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SyncQueues to delete
     */
    where?: SyncQueueWhereInput
    /**
     * Limit how many SyncQueues to delete.
     */
    limit?: number
  }

  /**
   * SyncQueue without action
   */
  export type SyncQueueDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncQueue
     */
    select?: SyncQueueSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SyncQueue
     */
    omit?: SyncQueueOmit<ExtArgs> | null
  }


  /**
   * Model DanhMucBenhVien
   */

  export type AggregateDanhMucBenhVien = {
    _count: DanhMucBenhVienCountAggregateOutputType | null
    _avg: DanhMucBenhVienAvgAggregateOutputType | null
    _sum: DanhMucBenhVienSumAggregateOutputType | null
    _min: DanhMucBenhVienMinAggregateOutputType | null
    _max: DanhMucBenhVienMaxAggregateOutputType | null
  }

  export type DanhMucBenhVienAvgAggregateOutputType = {
    id: number | null
  }

  export type DanhMucBenhVienSumAggregateOutputType = {
    id: number | null
  }

  export type DanhMucBenhVienMinAggregateOutputType = {
    id: number | null
    ten: string | null
    trangThai: string | null
  }

  export type DanhMucBenhVienMaxAggregateOutputType = {
    id: number | null
    ten: string | null
    trangThai: string | null
  }

  export type DanhMucBenhVienCountAggregateOutputType = {
    id: number
    ten: number
    trangThai: number
    _all: number
  }


  export type DanhMucBenhVienAvgAggregateInputType = {
    id?: true
  }

  export type DanhMucBenhVienSumAggregateInputType = {
    id?: true
  }

  export type DanhMucBenhVienMinAggregateInputType = {
    id?: true
    ten?: true
    trangThai?: true
  }

  export type DanhMucBenhVienMaxAggregateInputType = {
    id?: true
    ten?: true
    trangThai?: true
  }

  export type DanhMucBenhVienCountAggregateInputType = {
    id?: true
    ten?: true
    trangThai?: true
    _all?: true
  }

  export type DanhMucBenhVienAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which DanhMucBenhVien to aggregate.
     */
    where?: DanhMucBenhVienWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DanhMucBenhViens to fetch.
     */
    orderBy?: DanhMucBenhVienOrderByWithRelationInput | DanhMucBenhVienOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: DanhMucBenhVienWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DanhMucBenhViens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DanhMucBenhViens.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned DanhMucBenhViens
    **/
    _count?: true | DanhMucBenhVienCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: DanhMucBenhVienAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: DanhMucBenhVienSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: DanhMucBenhVienMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: DanhMucBenhVienMaxAggregateInputType
  }

  export type GetDanhMucBenhVienAggregateType<T extends DanhMucBenhVienAggregateArgs> = {
        [P in keyof T & keyof AggregateDanhMucBenhVien]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateDanhMucBenhVien[P]>
      : GetScalarType<T[P], AggregateDanhMucBenhVien[P]>
  }




  export type DanhMucBenhVienGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: DanhMucBenhVienWhereInput
    orderBy?: DanhMucBenhVienOrderByWithAggregationInput | DanhMucBenhVienOrderByWithAggregationInput[]
    by: DanhMucBenhVienScalarFieldEnum[] | DanhMucBenhVienScalarFieldEnum
    having?: DanhMucBenhVienScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: DanhMucBenhVienCountAggregateInputType | true
    _avg?: DanhMucBenhVienAvgAggregateInputType
    _sum?: DanhMucBenhVienSumAggregateInputType
    _min?: DanhMucBenhVienMinAggregateInputType
    _max?: DanhMucBenhVienMaxAggregateInputType
  }

  export type DanhMucBenhVienGroupByOutputType = {
    id: number
    ten: string
    trangThai: string
    _count: DanhMucBenhVienCountAggregateOutputType | null
    _avg: DanhMucBenhVienAvgAggregateOutputType | null
    _sum: DanhMucBenhVienSumAggregateOutputType | null
    _min: DanhMucBenhVienMinAggregateOutputType | null
    _max: DanhMucBenhVienMaxAggregateOutputType | null
  }

  type GetDanhMucBenhVienGroupByPayload<T extends DanhMucBenhVienGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<DanhMucBenhVienGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof DanhMucBenhVienGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], DanhMucBenhVienGroupByOutputType[P]>
            : GetScalarType<T[P], DanhMucBenhVienGroupByOutputType[P]>
        }
      >
    >


  export type DanhMucBenhVienSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    ten?: boolean
    trangThai?: boolean
  }, ExtArgs["result"]["danhMucBenhVien"]>

  export type DanhMucBenhVienSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    ten?: boolean
    trangThai?: boolean
  }, ExtArgs["result"]["danhMucBenhVien"]>

  export type DanhMucBenhVienSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    ten?: boolean
    trangThai?: boolean
  }, ExtArgs["result"]["danhMucBenhVien"]>

  export type DanhMucBenhVienSelectScalar = {
    id?: boolean
    ten?: boolean
    trangThai?: boolean
  }

  export type DanhMucBenhVienOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "ten" | "trangThai", ExtArgs["result"]["danhMucBenhVien"]>

  export type $DanhMucBenhVienPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "DanhMucBenhVien"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: number
      ten: string
      trangThai: string
    }, ExtArgs["result"]["danhMucBenhVien"]>
    composites: {}
  }

  type DanhMucBenhVienGetPayload<S extends boolean | null | undefined | DanhMucBenhVienDefaultArgs> = $Result.GetResult<Prisma.$DanhMucBenhVienPayload, S>

  type DanhMucBenhVienCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<DanhMucBenhVienFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: DanhMucBenhVienCountAggregateInputType | true
    }

  export interface DanhMucBenhVienDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['DanhMucBenhVien'], meta: { name: 'DanhMucBenhVien' } }
    /**
     * Find zero or one DanhMucBenhVien that matches the filter.
     * @param {DanhMucBenhVienFindUniqueArgs} args - Arguments to find a DanhMucBenhVien
     * @example
     * // Get one DanhMucBenhVien
     * const danhMucBenhVien = await prisma.danhMucBenhVien.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends DanhMucBenhVienFindUniqueArgs>(args: SelectSubset<T, DanhMucBenhVienFindUniqueArgs<ExtArgs>>): Prisma__DanhMucBenhVienClient<$Result.GetResult<Prisma.$DanhMucBenhVienPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one DanhMucBenhVien that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {DanhMucBenhVienFindUniqueOrThrowArgs} args - Arguments to find a DanhMucBenhVien
     * @example
     * // Get one DanhMucBenhVien
     * const danhMucBenhVien = await prisma.danhMucBenhVien.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends DanhMucBenhVienFindUniqueOrThrowArgs>(args: SelectSubset<T, DanhMucBenhVienFindUniqueOrThrowArgs<ExtArgs>>): Prisma__DanhMucBenhVienClient<$Result.GetResult<Prisma.$DanhMucBenhVienPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first DanhMucBenhVien that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DanhMucBenhVienFindFirstArgs} args - Arguments to find a DanhMucBenhVien
     * @example
     * // Get one DanhMucBenhVien
     * const danhMucBenhVien = await prisma.danhMucBenhVien.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends DanhMucBenhVienFindFirstArgs>(args?: SelectSubset<T, DanhMucBenhVienFindFirstArgs<ExtArgs>>): Prisma__DanhMucBenhVienClient<$Result.GetResult<Prisma.$DanhMucBenhVienPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first DanhMucBenhVien that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DanhMucBenhVienFindFirstOrThrowArgs} args - Arguments to find a DanhMucBenhVien
     * @example
     * // Get one DanhMucBenhVien
     * const danhMucBenhVien = await prisma.danhMucBenhVien.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends DanhMucBenhVienFindFirstOrThrowArgs>(args?: SelectSubset<T, DanhMucBenhVienFindFirstOrThrowArgs<ExtArgs>>): Prisma__DanhMucBenhVienClient<$Result.GetResult<Prisma.$DanhMucBenhVienPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more DanhMucBenhViens that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DanhMucBenhVienFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all DanhMucBenhViens
     * const danhMucBenhViens = await prisma.danhMucBenhVien.findMany()
     * 
     * // Get first 10 DanhMucBenhViens
     * const danhMucBenhViens = await prisma.danhMucBenhVien.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const danhMucBenhVienWithIdOnly = await prisma.danhMucBenhVien.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends DanhMucBenhVienFindManyArgs>(args?: SelectSubset<T, DanhMucBenhVienFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DanhMucBenhVienPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a DanhMucBenhVien.
     * @param {DanhMucBenhVienCreateArgs} args - Arguments to create a DanhMucBenhVien.
     * @example
     * // Create one DanhMucBenhVien
     * const DanhMucBenhVien = await prisma.danhMucBenhVien.create({
     *   data: {
     *     // ... data to create a DanhMucBenhVien
     *   }
     * })
     * 
     */
    create<T extends DanhMucBenhVienCreateArgs>(args: SelectSubset<T, DanhMucBenhVienCreateArgs<ExtArgs>>): Prisma__DanhMucBenhVienClient<$Result.GetResult<Prisma.$DanhMucBenhVienPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many DanhMucBenhViens.
     * @param {DanhMucBenhVienCreateManyArgs} args - Arguments to create many DanhMucBenhViens.
     * @example
     * // Create many DanhMucBenhViens
     * const danhMucBenhVien = await prisma.danhMucBenhVien.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends DanhMucBenhVienCreateManyArgs>(args?: SelectSubset<T, DanhMucBenhVienCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many DanhMucBenhViens and returns the data saved in the database.
     * @param {DanhMucBenhVienCreateManyAndReturnArgs} args - Arguments to create many DanhMucBenhViens.
     * @example
     * // Create many DanhMucBenhViens
     * const danhMucBenhVien = await prisma.danhMucBenhVien.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many DanhMucBenhViens and only return the `id`
     * const danhMucBenhVienWithIdOnly = await prisma.danhMucBenhVien.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends DanhMucBenhVienCreateManyAndReturnArgs>(args?: SelectSubset<T, DanhMucBenhVienCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DanhMucBenhVienPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a DanhMucBenhVien.
     * @param {DanhMucBenhVienDeleteArgs} args - Arguments to delete one DanhMucBenhVien.
     * @example
     * // Delete one DanhMucBenhVien
     * const DanhMucBenhVien = await prisma.danhMucBenhVien.delete({
     *   where: {
     *     // ... filter to delete one DanhMucBenhVien
     *   }
     * })
     * 
     */
    delete<T extends DanhMucBenhVienDeleteArgs>(args: SelectSubset<T, DanhMucBenhVienDeleteArgs<ExtArgs>>): Prisma__DanhMucBenhVienClient<$Result.GetResult<Prisma.$DanhMucBenhVienPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one DanhMucBenhVien.
     * @param {DanhMucBenhVienUpdateArgs} args - Arguments to update one DanhMucBenhVien.
     * @example
     * // Update one DanhMucBenhVien
     * const danhMucBenhVien = await prisma.danhMucBenhVien.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends DanhMucBenhVienUpdateArgs>(args: SelectSubset<T, DanhMucBenhVienUpdateArgs<ExtArgs>>): Prisma__DanhMucBenhVienClient<$Result.GetResult<Prisma.$DanhMucBenhVienPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more DanhMucBenhViens.
     * @param {DanhMucBenhVienDeleteManyArgs} args - Arguments to filter DanhMucBenhViens to delete.
     * @example
     * // Delete a few DanhMucBenhViens
     * const { count } = await prisma.danhMucBenhVien.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends DanhMucBenhVienDeleteManyArgs>(args?: SelectSubset<T, DanhMucBenhVienDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more DanhMucBenhViens.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DanhMucBenhVienUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many DanhMucBenhViens
     * const danhMucBenhVien = await prisma.danhMucBenhVien.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends DanhMucBenhVienUpdateManyArgs>(args: SelectSubset<T, DanhMucBenhVienUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more DanhMucBenhViens and returns the data updated in the database.
     * @param {DanhMucBenhVienUpdateManyAndReturnArgs} args - Arguments to update many DanhMucBenhViens.
     * @example
     * // Update many DanhMucBenhViens
     * const danhMucBenhVien = await prisma.danhMucBenhVien.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more DanhMucBenhViens and only return the `id`
     * const danhMucBenhVienWithIdOnly = await prisma.danhMucBenhVien.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends DanhMucBenhVienUpdateManyAndReturnArgs>(args: SelectSubset<T, DanhMucBenhVienUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DanhMucBenhVienPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one DanhMucBenhVien.
     * @param {DanhMucBenhVienUpsertArgs} args - Arguments to update or create a DanhMucBenhVien.
     * @example
     * // Update or create a DanhMucBenhVien
     * const danhMucBenhVien = await prisma.danhMucBenhVien.upsert({
     *   create: {
     *     // ... data to create a DanhMucBenhVien
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the DanhMucBenhVien we want to update
     *   }
     * })
     */
    upsert<T extends DanhMucBenhVienUpsertArgs>(args: SelectSubset<T, DanhMucBenhVienUpsertArgs<ExtArgs>>): Prisma__DanhMucBenhVienClient<$Result.GetResult<Prisma.$DanhMucBenhVienPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of DanhMucBenhViens.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DanhMucBenhVienCountArgs} args - Arguments to filter DanhMucBenhViens to count.
     * @example
     * // Count the number of DanhMucBenhViens
     * const count = await prisma.danhMucBenhVien.count({
     *   where: {
     *     // ... the filter for the DanhMucBenhViens we want to count
     *   }
     * })
    **/
    count<T extends DanhMucBenhVienCountArgs>(
      args?: Subset<T, DanhMucBenhVienCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], DanhMucBenhVienCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a DanhMucBenhVien.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DanhMucBenhVienAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends DanhMucBenhVienAggregateArgs>(args: Subset<T, DanhMucBenhVienAggregateArgs>): Prisma.PrismaPromise<GetDanhMucBenhVienAggregateType<T>>

    /**
     * Group by DanhMucBenhVien.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DanhMucBenhVienGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends DanhMucBenhVienGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: DanhMucBenhVienGroupByArgs['orderBy'] }
        : { orderBy?: DanhMucBenhVienGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, DanhMucBenhVienGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetDanhMucBenhVienGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the DanhMucBenhVien model
   */
  readonly fields: DanhMucBenhVienFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for DanhMucBenhVien.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__DanhMucBenhVienClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the DanhMucBenhVien model
   */
  interface DanhMucBenhVienFieldRefs {
    readonly id: FieldRef<"DanhMucBenhVien", 'Int'>
    readonly ten: FieldRef<"DanhMucBenhVien", 'String'>
    readonly trangThai: FieldRef<"DanhMucBenhVien", 'String'>
  }
    

  // Custom InputTypes
  /**
   * DanhMucBenhVien findUnique
   */
  export type DanhMucBenhVienFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DanhMucBenhVien
     */
    select?: DanhMucBenhVienSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DanhMucBenhVien
     */
    omit?: DanhMucBenhVienOmit<ExtArgs> | null
    /**
     * Filter, which DanhMucBenhVien to fetch.
     */
    where: DanhMucBenhVienWhereUniqueInput
  }

  /**
   * DanhMucBenhVien findUniqueOrThrow
   */
  export type DanhMucBenhVienFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DanhMucBenhVien
     */
    select?: DanhMucBenhVienSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DanhMucBenhVien
     */
    omit?: DanhMucBenhVienOmit<ExtArgs> | null
    /**
     * Filter, which DanhMucBenhVien to fetch.
     */
    where: DanhMucBenhVienWhereUniqueInput
  }

  /**
   * DanhMucBenhVien findFirst
   */
  export type DanhMucBenhVienFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DanhMucBenhVien
     */
    select?: DanhMucBenhVienSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DanhMucBenhVien
     */
    omit?: DanhMucBenhVienOmit<ExtArgs> | null
    /**
     * Filter, which DanhMucBenhVien to fetch.
     */
    where?: DanhMucBenhVienWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DanhMucBenhViens to fetch.
     */
    orderBy?: DanhMucBenhVienOrderByWithRelationInput | DanhMucBenhVienOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for DanhMucBenhViens.
     */
    cursor?: DanhMucBenhVienWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DanhMucBenhViens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DanhMucBenhViens.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of DanhMucBenhViens.
     */
    distinct?: DanhMucBenhVienScalarFieldEnum | DanhMucBenhVienScalarFieldEnum[]
  }

  /**
   * DanhMucBenhVien findFirstOrThrow
   */
  export type DanhMucBenhVienFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DanhMucBenhVien
     */
    select?: DanhMucBenhVienSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DanhMucBenhVien
     */
    omit?: DanhMucBenhVienOmit<ExtArgs> | null
    /**
     * Filter, which DanhMucBenhVien to fetch.
     */
    where?: DanhMucBenhVienWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DanhMucBenhViens to fetch.
     */
    orderBy?: DanhMucBenhVienOrderByWithRelationInput | DanhMucBenhVienOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for DanhMucBenhViens.
     */
    cursor?: DanhMucBenhVienWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DanhMucBenhViens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DanhMucBenhViens.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of DanhMucBenhViens.
     */
    distinct?: DanhMucBenhVienScalarFieldEnum | DanhMucBenhVienScalarFieldEnum[]
  }

  /**
   * DanhMucBenhVien findMany
   */
  export type DanhMucBenhVienFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DanhMucBenhVien
     */
    select?: DanhMucBenhVienSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DanhMucBenhVien
     */
    omit?: DanhMucBenhVienOmit<ExtArgs> | null
    /**
     * Filter, which DanhMucBenhViens to fetch.
     */
    where?: DanhMucBenhVienWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DanhMucBenhViens to fetch.
     */
    orderBy?: DanhMucBenhVienOrderByWithRelationInput | DanhMucBenhVienOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing DanhMucBenhViens.
     */
    cursor?: DanhMucBenhVienWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DanhMucBenhViens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DanhMucBenhViens.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of DanhMucBenhViens.
     */
    distinct?: DanhMucBenhVienScalarFieldEnum | DanhMucBenhVienScalarFieldEnum[]
  }

  /**
   * DanhMucBenhVien create
   */
  export type DanhMucBenhVienCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DanhMucBenhVien
     */
    select?: DanhMucBenhVienSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DanhMucBenhVien
     */
    omit?: DanhMucBenhVienOmit<ExtArgs> | null
    /**
     * The data needed to create a DanhMucBenhVien.
     */
    data: XOR<DanhMucBenhVienCreateInput, DanhMucBenhVienUncheckedCreateInput>
  }

  /**
   * DanhMucBenhVien createMany
   */
  export type DanhMucBenhVienCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many DanhMucBenhViens.
     */
    data: DanhMucBenhVienCreateManyInput | DanhMucBenhVienCreateManyInput[]
  }

  /**
   * DanhMucBenhVien createManyAndReturn
   */
  export type DanhMucBenhVienCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DanhMucBenhVien
     */
    select?: DanhMucBenhVienSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the DanhMucBenhVien
     */
    omit?: DanhMucBenhVienOmit<ExtArgs> | null
    /**
     * The data used to create many DanhMucBenhViens.
     */
    data: DanhMucBenhVienCreateManyInput | DanhMucBenhVienCreateManyInput[]
  }

  /**
   * DanhMucBenhVien update
   */
  export type DanhMucBenhVienUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DanhMucBenhVien
     */
    select?: DanhMucBenhVienSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DanhMucBenhVien
     */
    omit?: DanhMucBenhVienOmit<ExtArgs> | null
    /**
     * The data needed to update a DanhMucBenhVien.
     */
    data: XOR<DanhMucBenhVienUpdateInput, DanhMucBenhVienUncheckedUpdateInput>
    /**
     * Choose, which DanhMucBenhVien to update.
     */
    where: DanhMucBenhVienWhereUniqueInput
  }

  /**
   * DanhMucBenhVien updateMany
   */
  export type DanhMucBenhVienUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update DanhMucBenhViens.
     */
    data: XOR<DanhMucBenhVienUpdateManyMutationInput, DanhMucBenhVienUncheckedUpdateManyInput>
    /**
     * Filter which DanhMucBenhViens to update
     */
    where?: DanhMucBenhVienWhereInput
    /**
     * Limit how many DanhMucBenhViens to update.
     */
    limit?: number
  }

  /**
   * DanhMucBenhVien updateManyAndReturn
   */
  export type DanhMucBenhVienUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DanhMucBenhVien
     */
    select?: DanhMucBenhVienSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the DanhMucBenhVien
     */
    omit?: DanhMucBenhVienOmit<ExtArgs> | null
    /**
     * The data used to update DanhMucBenhViens.
     */
    data: XOR<DanhMucBenhVienUpdateManyMutationInput, DanhMucBenhVienUncheckedUpdateManyInput>
    /**
     * Filter which DanhMucBenhViens to update
     */
    where?: DanhMucBenhVienWhereInput
    /**
     * Limit how many DanhMucBenhViens to update.
     */
    limit?: number
  }

  /**
   * DanhMucBenhVien upsert
   */
  export type DanhMucBenhVienUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DanhMucBenhVien
     */
    select?: DanhMucBenhVienSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DanhMucBenhVien
     */
    omit?: DanhMucBenhVienOmit<ExtArgs> | null
    /**
     * The filter to search for the DanhMucBenhVien to update in case it exists.
     */
    where: DanhMucBenhVienWhereUniqueInput
    /**
     * In case the DanhMucBenhVien found by the `where` argument doesn't exist, create a new DanhMucBenhVien with this data.
     */
    create: XOR<DanhMucBenhVienCreateInput, DanhMucBenhVienUncheckedCreateInput>
    /**
     * In case the DanhMucBenhVien was found with the provided `where` argument, update it with this data.
     */
    update: XOR<DanhMucBenhVienUpdateInput, DanhMucBenhVienUncheckedUpdateInput>
  }

  /**
   * DanhMucBenhVien delete
   */
  export type DanhMucBenhVienDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DanhMucBenhVien
     */
    select?: DanhMucBenhVienSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DanhMucBenhVien
     */
    omit?: DanhMucBenhVienOmit<ExtArgs> | null
    /**
     * Filter which DanhMucBenhVien to delete.
     */
    where: DanhMucBenhVienWhereUniqueInput
  }

  /**
   * DanhMucBenhVien deleteMany
   */
  export type DanhMucBenhVienDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which DanhMucBenhViens to delete
     */
    where?: DanhMucBenhVienWhereInput
    /**
     * Limit how many DanhMucBenhViens to delete.
     */
    limit?: number
  }

  /**
   * DanhMucBenhVien without action
   */
  export type DanhMucBenhVienDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DanhMucBenhVien
     */
    select?: DanhMucBenhVienSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DanhMucBenhVien
     */
    omit?: DanhMucBenhVienOmit<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const CoSoScalarFieldEnum: {
    id: 'id',
    ten: 'ten',
    diaChi: 'diaChi',
    trangThai: 'trangThai',
    sheetId: 'sheetId',
    bhxhUser: 'bhxhUser',
    bhxhPass: 'bhxhPass',
    bhxhMaCSKCB: 'bhxhMaCSKCB',
    bhxhHoTenCB: 'bhxhHoTenCB',
    bhxhCccdCB: 'bhxhCccdCB',
    hisHost: 'hisHost',
    hisPort: 'hisPort',
    hisUser: 'hisUser',
    hisPass: 'hisPass',
    hisDbName: 'hisDbName'
  };

  export type CoSoScalarFieldEnum = (typeof CoSoScalarFieldEnum)[keyof typeof CoSoScalarFieldEnum]


  export const NguoiDungCSRScalarFieldEnum: {
    maNV: 'maNV',
    hoTen: 'hoTen',
    vaiTro: 'vaiTro',
    coSoId: 'coSoId',
    tenDangNhap: 'tenDangNhap',
    matKhauHash: 'matKhauHash',
    trangThai: 'trangThai'
  };

  export type NguoiDungCSRScalarFieldEnum = (typeof NguoiDungCSRScalarFieldEnum)[keyof typeof NguoiDungCSRScalarFieldEnum]


  export const BuoiKhamScalarFieldEnum: {
    id: 'id',
    coSoId: 'coSoId',
    ngayKham: 'ngayKham',
    xa: 'xa',
    diaDiem: 'diaDiem',
    ghiChu: 'ghiChu',
    nguoiTao: 'nguoiTao',
    createdAt: 'createdAt',
    syncStatus: 'syncStatus'
  };

  export type BuoiKhamScalarFieldEnum = (typeof BuoiKhamScalarFieldEnum)[keyof typeof BuoiKhamScalarFieldEnum]


  export const HoSoBenhNhanScalarFieldEnum: {
    id: 'id',
    maBN: 'maBN',
    maBNHIS: 'maBNHIS',
    stt: 'stt',
    buoiKhamId: 'buoiKhamId',
    coSoId: 'coSoId',
    hoTen: 'hoTen',
    gioiTinh: 'gioiTinh',
    ngaySinh: 'ngaySinh',
    namSinh: 'namSinh',
    cccd: 'cccd',
    diaChi: 'diaChi',
    sdt: 'sdt',
    sdtNguoiNha: 'sdtNguoiNha',
    thiLucMP: 'thiLucMP',
    thiLucMT: 'thiLucMT',
    chanDoan: 'chanDoan',
    chanDoanKhac: 'chanDoanKhac',
    khuyenNghi: 'khuyenNghi',
    bhyt: 'bhyt',
    tuVanVienMa: 'tuVanVienMa',
    soTienBao: 'soTienBao',
    ngayDieuTri: 'ngayDieuTri',
    diemDon: 'diemDon',
    gioDon: 'gioDon',
    nhom: 'nhom',
    followUpStatus: 'followUpStatus',
    nguoiPhuTrachMa: 'nguoiPhuTrachMa',
    nguoiChotCuoiMa: 'nguoiChotCuoiMa',
    ngayChot: 'ngayChot',
    daDon: 'daDon',
    ngayMoThucTe: 'ngayMoThucTe',
    soTienThucThu: 'soTienThucThu',
    trangThaiDieuTri: 'trangThaiDieuTri',
    ngayTaiKham: 'ngayTaiKham',
    ghiChuMat2: 'ghiChuMat2',
    trangThai: 'trangThai',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    createdBy: 'createdBy',
    updatedBy: 'updatedBy',
    syncStatus: 'syncStatus'
  };

  export type HoSoBenhNhanScalarFieldEnum = (typeof HoSoBenhNhanScalarFieldEnum)[keyof typeof HoSoBenhNhanScalarFieldEnum]


  export const NhatKyTheoDoiScalarFieldEnum: {
    id: 'id',
    hoSoId: 'hoSoId',
    ngay: 'ngay',
    nguoiGoiMa: 'nguoiGoiMa',
    noiDung: 'noiDung',
    syncStatus: 'syncStatus'
  };

  export type NhatKyTheoDoiScalarFieldEnum = (typeof NhatKyTheoDoiScalarFieldEnum)[keyof typeof NhatKyTheoDoiScalarFieldEnum]


  export const AuditLogScalarFieldEnum: {
    id: 'id',
    bang: 'bang',
    banGhiId: 'banGhiId',
    hanhDong: 'hanhDong',
    nguoiDung: 'nguoiDung',
    thoiDiem: 'thoiDiem',
    thayDoi: 'thayDoi'
  };

  export type AuditLogScalarFieldEnum = (typeof AuditLogScalarFieldEnum)[keyof typeof AuditLogScalarFieldEnum]


  export const SyncQueueScalarFieldEnum: {
    id: 'id',
    hoSoId: 'hoSoId',
    createdAt: 'createdAt',
    retries: 'retries'
  };

  export type SyncQueueScalarFieldEnum = (typeof SyncQueueScalarFieldEnum)[keyof typeof SyncQueueScalarFieldEnum]


  export const DanhMucBenhVienScalarFieldEnum: {
    id: 'id',
    ten: 'ten',
    trangThai: 'trangThai'
  };

  export type DanhMucBenhVienScalarFieldEnum = (typeof DanhMucBenhVienScalarFieldEnum)[keyof typeof DanhMucBenhVienScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    
  /**
   * Deep Input Types
   */


  export type CoSoWhereInput = {
    AND?: CoSoWhereInput | CoSoWhereInput[]
    OR?: CoSoWhereInput[]
    NOT?: CoSoWhereInput | CoSoWhereInput[]
    id?: StringFilter<"CoSo"> | string
    ten?: StringFilter<"CoSo"> | string
    diaChi?: StringNullableFilter<"CoSo"> | string | null
    trangThai?: StringFilter<"CoSo"> | string
    sheetId?: StringNullableFilter<"CoSo"> | string | null
    bhxhUser?: StringNullableFilter<"CoSo"> | string | null
    bhxhPass?: StringNullableFilter<"CoSo"> | string | null
    bhxhMaCSKCB?: StringNullableFilter<"CoSo"> | string | null
    bhxhHoTenCB?: StringNullableFilter<"CoSo"> | string | null
    bhxhCccdCB?: StringNullableFilter<"CoSo"> | string | null
    hisHost?: StringNullableFilter<"CoSo"> | string | null
    hisPort?: StringNullableFilter<"CoSo"> | string | null
    hisUser?: StringNullableFilter<"CoSo"> | string | null
    hisPass?: StringNullableFilter<"CoSo"> | string | null
    hisDbName?: StringNullableFilter<"CoSo"> | string | null
    buoiKham?: BuoiKhamListRelationFilter
    nguoiDung?: NguoiDungCSRListRelationFilter
    hoSo?: HoSoBenhNhanListRelationFilter
  }

  export type CoSoOrderByWithRelationInput = {
    id?: SortOrder
    ten?: SortOrder
    diaChi?: SortOrderInput | SortOrder
    trangThai?: SortOrder
    sheetId?: SortOrderInput | SortOrder
    bhxhUser?: SortOrderInput | SortOrder
    bhxhPass?: SortOrderInput | SortOrder
    bhxhMaCSKCB?: SortOrderInput | SortOrder
    bhxhHoTenCB?: SortOrderInput | SortOrder
    bhxhCccdCB?: SortOrderInput | SortOrder
    hisHost?: SortOrderInput | SortOrder
    hisPort?: SortOrderInput | SortOrder
    hisUser?: SortOrderInput | SortOrder
    hisPass?: SortOrderInput | SortOrder
    hisDbName?: SortOrderInput | SortOrder
    buoiKham?: BuoiKhamOrderByRelationAggregateInput
    nguoiDung?: NguoiDungCSROrderByRelationAggregateInput
    hoSo?: HoSoBenhNhanOrderByRelationAggregateInput
  }

  export type CoSoWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: CoSoWhereInput | CoSoWhereInput[]
    OR?: CoSoWhereInput[]
    NOT?: CoSoWhereInput | CoSoWhereInput[]
    ten?: StringFilter<"CoSo"> | string
    diaChi?: StringNullableFilter<"CoSo"> | string | null
    trangThai?: StringFilter<"CoSo"> | string
    sheetId?: StringNullableFilter<"CoSo"> | string | null
    bhxhUser?: StringNullableFilter<"CoSo"> | string | null
    bhxhPass?: StringNullableFilter<"CoSo"> | string | null
    bhxhMaCSKCB?: StringNullableFilter<"CoSo"> | string | null
    bhxhHoTenCB?: StringNullableFilter<"CoSo"> | string | null
    bhxhCccdCB?: StringNullableFilter<"CoSo"> | string | null
    hisHost?: StringNullableFilter<"CoSo"> | string | null
    hisPort?: StringNullableFilter<"CoSo"> | string | null
    hisUser?: StringNullableFilter<"CoSo"> | string | null
    hisPass?: StringNullableFilter<"CoSo"> | string | null
    hisDbName?: StringNullableFilter<"CoSo"> | string | null
    buoiKham?: BuoiKhamListRelationFilter
    nguoiDung?: NguoiDungCSRListRelationFilter
    hoSo?: HoSoBenhNhanListRelationFilter
  }, "id">

  export type CoSoOrderByWithAggregationInput = {
    id?: SortOrder
    ten?: SortOrder
    diaChi?: SortOrderInput | SortOrder
    trangThai?: SortOrder
    sheetId?: SortOrderInput | SortOrder
    bhxhUser?: SortOrderInput | SortOrder
    bhxhPass?: SortOrderInput | SortOrder
    bhxhMaCSKCB?: SortOrderInput | SortOrder
    bhxhHoTenCB?: SortOrderInput | SortOrder
    bhxhCccdCB?: SortOrderInput | SortOrder
    hisHost?: SortOrderInput | SortOrder
    hisPort?: SortOrderInput | SortOrder
    hisUser?: SortOrderInput | SortOrder
    hisPass?: SortOrderInput | SortOrder
    hisDbName?: SortOrderInput | SortOrder
    _count?: CoSoCountOrderByAggregateInput
    _max?: CoSoMaxOrderByAggregateInput
    _min?: CoSoMinOrderByAggregateInput
  }

  export type CoSoScalarWhereWithAggregatesInput = {
    AND?: CoSoScalarWhereWithAggregatesInput | CoSoScalarWhereWithAggregatesInput[]
    OR?: CoSoScalarWhereWithAggregatesInput[]
    NOT?: CoSoScalarWhereWithAggregatesInput | CoSoScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"CoSo"> | string
    ten?: StringWithAggregatesFilter<"CoSo"> | string
    diaChi?: StringNullableWithAggregatesFilter<"CoSo"> | string | null
    trangThai?: StringWithAggregatesFilter<"CoSo"> | string
    sheetId?: StringNullableWithAggregatesFilter<"CoSo"> | string | null
    bhxhUser?: StringNullableWithAggregatesFilter<"CoSo"> | string | null
    bhxhPass?: StringNullableWithAggregatesFilter<"CoSo"> | string | null
    bhxhMaCSKCB?: StringNullableWithAggregatesFilter<"CoSo"> | string | null
    bhxhHoTenCB?: StringNullableWithAggregatesFilter<"CoSo"> | string | null
    bhxhCccdCB?: StringNullableWithAggregatesFilter<"CoSo"> | string | null
    hisHost?: StringNullableWithAggregatesFilter<"CoSo"> | string | null
    hisPort?: StringNullableWithAggregatesFilter<"CoSo"> | string | null
    hisUser?: StringNullableWithAggregatesFilter<"CoSo"> | string | null
    hisPass?: StringNullableWithAggregatesFilter<"CoSo"> | string | null
    hisDbName?: StringNullableWithAggregatesFilter<"CoSo"> | string | null
  }

  export type NguoiDungCSRWhereInput = {
    AND?: NguoiDungCSRWhereInput | NguoiDungCSRWhereInput[]
    OR?: NguoiDungCSRWhereInput[]
    NOT?: NguoiDungCSRWhereInput | NguoiDungCSRWhereInput[]
    maNV?: StringFilter<"NguoiDungCSR"> | string
    hoTen?: StringFilter<"NguoiDungCSR"> | string
    vaiTro?: StringFilter<"NguoiDungCSR"> | string
    coSoId?: StringNullableFilter<"NguoiDungCSR"> | string | null
    tenDangNhap?: StringFilter<"NguoiDungCSR"> | string
    matKhauHash?: StringFilter<"NguoiDungCSR"> | string
    trangThai?: StringFilter<"NguoiDungCSR"> | string
    coSo?: XOR<CoSoNullableScalarRelationFilter, CoSoWhereInput> | null
    buoiKhamTao?: BuoiKhamListRelationFilter
    hoSoTuVan?: HoSoBenhNhanListRelationFilter
    hoSoPhuTrach?: HoSoBenhNhanListRelationFilter
    hoSoChotCuoi?: HoSoBenhNhanListRelationFilter
    nhatKy?: NhatKyTheoDoiListRelationFilter
  }

  export type NguoiDungCSROrderByWithRelationInput = {
    maNV?: SortOrder
    hoTen?: SortOrder
    vaiTro?: SortOrder
    coSoId?: SortOrderInput | SortOrder
    tenDangNhap?: SortOrder
    matKhauHash?: SortOrder
    trangThai?: SortOrder
    coSo?: CoSoOrderByWithRelationInput
    buoiKhamTao?: BuoiKhamOrderByRelationAggregateInput
    hoSoTuVan?: HoSoBenhNhanOrderByRelationAggregateInput
    hoSoPhuTrach?: HoSoBenhNhanOrderByRelationAggregateInput
    hoSoChotCuoi?: HoSoBenhNhanOrderByRelationAggregateInput
    nhatKy?: NhatKyTheoDoiOrderByRelationAggregateInput
  }

  export type NguoiDungCSRWhereUniqueInput = Prisma.AtLeast<{
    maNV?: string
    tenDangNhap?: string
    AND?: NguoiDungCSRWhereInput | NguoiDungCSRWhereInput[]
    OR?: NguoiDungCSRWhereInput[]
    NOT?: NguoiDungCSRWhereInput | NguoiDungCSRWhereInput[]
    hoTen?: StringFilter<"NguoiDungCSR"> | string
    vaiTro?: StringFilter<"NguoiDungCSR"> | string
    coSoId?: StringNullableFilter<"NguoiDungCSR"> | string | null
    matKhauHash?: StringFilter<"NguoiDungCSR"> | string
    trangThai?: StringFilter<"NguoiDungCSR"> | string
    coSo?: XOR<CoSoNullableScalarRelationFilter, CoSoWhereInput> | null
    buoiKhamTao?: BuoiKhamListRelationFilter
    hoSoTuVan?: HoSoBenhNhanListRelationFilter
    hoSoPhuTrach?: HoSoBenhNhanListRelationFilter
    hoSoChotCuoi?: HoSoBenhNhanListRelationFilter
    nhatKy?: NhatKyTheoDoiListRelationFilter
  }, "maNV" | "tenDangNhap">

  export type NguoiDungCSROrderByWithAggregationInput = {
    maNV?: SortOrder
    hoTen?: SortOrder
    vaiTro?: SortOrder
    coSoId?: SortOrderInput | SortOrder
    tenDangNhap?: SortOrder
    matKhauHash?: SortOrder
    trangThai?: SortOrder
    _count?: NguoiDungCSRCountOrderByAggregateInput
    _max?: NguoiDungCSRMaxOrderByAggregateInput
    _min?: NguoiDungCSRMinOrderByAggregateInput
  }

  export type NguoiDungCSRScalarWhereWithAggregatesInput = {
    AND?: NguoiDungCSRScalarWhereWithAggregatesInput | NguoiDungCSRScalarWhereWithAggregatesInput[]
    OR?: NguoiDungCSRScalarWhereWithAggregatesInput[]
    NOT?: NguoiDungCSRScalarWhereWithAggregatesInput | NguoiDungCSRScalarWhereWithAggregatesInput[]
    maNV?: StringWithAggregatesFilter<"NguoiDungCSR"> | string
    hoTen?: StringWithAggregatesFilter<"NguoiDungCSR"> | string
    vaiTro?: StringWithAggregatesFilter<"NguoiDungCSR"> | string
    coSoId?: StringNullableWithAggregatesFilter<"NguoiDungCSR"> | string | null
    tenDangNhap?: StringWithAggregatesFilter<"NguoiDungCSR"> | string
    matKhauHash?: StringWithAggregatesFilter<"NguoiDungCSR"> | string
    trangThai?: StringWithAggregatesFilter<"NguoiDungCSR"> | string
  }

  export type BuoiKhamWhereInput = {
    AND?: BuoiKhamWhereInput | BuoiKhamWhereInput[]
    OR?: BuoiKhamWhereInput[]
    NOT?: BuoiKhamWhereInput | BuoiKhamWhereInput[]
    id?: StringFilter<"BuoiKham"> | string
    coSoId?: StringFilter<"BuoiKham"> | string
    ngayKham?: DateTimeFilter<"BuoiKham"> | Date | string
    xa?: StringFilter<"BuoiKham"> | string
    diaDiem?: StringFilter<"BuoiKham"> | string
    ghiChu?: StringNullableFilter<"BuoiKham"> | string | null
    nguoiTao?: StringFilter<"BuoiKham"> | string
    createdAt?: DateTimeFilter<"BuoiKham"> | Date | string
    syncStatus?: StringFilter<"BuoiKham"> | string
    coSo?: XOR<CoSoScalarRelationFilter, CoSoWhereInput>
    nguoiTaoRef?: XOR<NguoiDungCSRScalarRelationFilter, NguoiDungCSRWhereInput>
    hoSo?: HoSoBenhNhanListRelationFilter
  }

  export type BuoiKhamOrderByWithRelationInput = {
    id?: SortOrder
    coSoId?: SortOrder
    ngayKham?: SortOrder
    xa?: SortOrder
    diaDiem?: SortOrder
    ghiChu?: SortOrderInput | SortOrder
    nguoiTao?: SortOrder
    createdAt?: SortOrder
    syncStatus?: SortOrder
    coSo?: CoSoOrderByWithRelationInput
    nguoiTaoRef?: NguoiDungCSROrderByWithRelationInput
    hoSo?: HoSoBenhNhanOrderByRelationAggregateInput
  }

  export type BuoiKhamWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: BuoiKhamWhereInput | BuoiKhamWhereInput[]
    OR?: BuoiKhamWhereInput[]
    NOT?: BuoiKhamWhereInput | BuoiKhamWhereInput[]
    coSoId?: StringFilter<"BuoiKham"> | string
    ngayKham?: DateTimeFilter<"BuoiKham"> | Date | string
    xa?: StringFilter<"BuoiKham"> | string
    diaDiem?: StringFilter<"BuoiKham"> | string
    ghiChu?: StringNullableFilter<"BuoiKham"> | string | null
    nguoiTao?: StringFilter<"BuoiKham"> | string
    createdAt?: DateTimeFilter<"BuoiKham"> | Date | string
    syncStatus?: StringFilter<"BuoiKham"> | string
    coSo?: XOR<CoSoScalarRelationFilter, CoSoWhereInput>
    nguoiTaoRef?: XOR<NguoiDungCSRScalarRelationFilter, NguoiDungCSRWhereInput>
    hoSo?: HoSoBenhNhanListRelationFilter
  }, "id">

  export type BuoiKhamOrderByWithAggregationInput = {
    id?: SortOrder
    coSoId?: SortOrder
    ngayKham?: SortOrder
    xa?: SortOrder
    diaDiem?: SortOrder
    ghiChu?: SortOrderInput | SortOrder
    nguoiTao?: SortOrder
    createdAt?: SortOrder
    syncStatus?: SortOrder
    _count?: BuoiKhamCountOrderByAggregateInput
    _max?: BuoiKhamMaxOrderByAggregateInput
    _min?: BuoiKhamMinOrderByAggregateInput
  }

  export type BuoiKhamScalarWhereWithAggregatesInput = {
    AND?: BuoiKhamScalarWhereWithAggregatesInput | BuoiKhamScalarWhereWithAggregatesInput[]
    OR?: BuoiKhamScalarWhereWithAggregatesInput[]
    NOT?: BuoiKhamScalarWhereWithAggregatesInput | BuoiKhamScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"BuoiKham"> | string
    coSoId?: StringWithAggregatesFilter<"BuoiKham"> | string
    ngayKham?: DateTimeWithAggregatesFilter<"BuoiKham"> | Date | string
    xa?: StringWithAggregatesFilter<"BuoiKham"> | string
    diaDiem?: StringWithAggregatesFilter<"BuoiKham"> | string
    ghiChu?: StringNullableWithAggregatesFilter<"BuoiKham"> | string | null
    nguoiTao?: StringWithAggregatesFilter<"BuoiKham"> | string
    createdAt?: DateTimeWithAggregatesFilter<"BuoiKham"> | Date | string
    syncStatus?: StringWithAggregatesFilter<"BuoiKham"> | string
  }

  export type HoSoBenhNhanWhereInput = {
    AND?: HoSoBenhNhanWhereInput | HoSoBenhNhanWhereInput[]
    OR?: HoSoBenhNhanWhereInput[]
    NOT?: HoSoBenhNhanWhereInput | HoSoBenhNhanWhereInput[]
    id?: StringFilter<"HoSoBenhNhan"> | string
    maBN?: StringFilter<"HoSoBenhNhan"> | string
    maBNHIS?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    stt?: IntFilter<"HoSoBenhNhan"> | number
    buoiKhamId?: StringFilter<"HoSoBenhNhan"> | string
    coSoId?: StringFilter<"HoSoBenhNhan"> | string
    hoTen?: StringFilter<"HoSoBenhNhan"> | string
    gioiTinh?: StringFilter<"HoSoBenhNhan"> | string
    ngaySinh?: DateTimeNullableFilter<"HoSoBenhNhan"> | Date | string | null
    namSinh?: IntFilter<"HoSoBenhNhan"> | number
    cccd?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    diaChi?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    sdt?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    sdtNguoiNha?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    thiLucMP?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    thiLucMT?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    chanDoan?: StringFilter<"HoSoBenhNhan"> | string
    chanDoanKhac?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    khuyenNghi?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    bhyt?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    tuVanVienMa?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    soTienBao?: FloatNullableFilter<"HoSoBenhNhan"> | number | null
    ngayDieuTri?: DateTimeNullableFilter<"HoSoBenhNhan"> | Date | string | null
    diemDon?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    gioDon?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    nhom?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    followUpStatus?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    nguoiPhuTrachMa?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    nguoiChotCuoiMa?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    ngayChot?: DateTimeNullableFilter<"HoSoBenhNhan"> | Date | string | null
    daDon?: BoolFilter<"HoSoBenhNhan"> | boolean
    ngayMoThucTe?: DateTimeNullableFilter<"HoSoBenhNhan"> | Date | string | null
    soTienThucThu?: FloatNullableFilter<"HoSoBenhNhan"> | number | null
    trangThaiDieuTri?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    ngayTaiKham?: DateTimeNullableFilter<"HoSoBenhNhan"> | Date | string | null
    ghiChuMat2?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    trangThai?: StringFilter<"HoSoBenhNhan"> | string
    createdAt?: DateTimeFilter<"HoSoBenhNhan"> | Date | string
    updatedAt?: DateTimeFilter<"HoSoBenhNhan"> | Date | string
    createdBy?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    updatedBy?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    syncStatus?: StringFilter<"HoSoBenhNhan"> | string
    buoiKham?: XOR<BuoiKhamScalarRelationFilter, BuoiKhamWhereInput>
    coSo?: XOR<CoSoScalarRelationFilter, CoSoWhereInput>
    tuVanVien?: XOR<NguoiDungCSRNullableScalarRelationFilter, NguoiDungCSRWhereInput> | null
    nguoiPhuTrach?: XOR<NguoiDungCSRNullableScalarRelationFilter, NguoiDungCSRWhereInput> | null
    nguoiChotCuoi?: XOR<NguoiDungCSRNullableScalarRelationFilter, NguoiDungCSRWhereInput> | null
    nhatKy?: NhatKyTheoDoiListRelationFilter
  }

  export type HoSoBenhNhanOrderByWithRelationInput = {
    id?: SortOrder
    maBN?: SortOrder
    maBNHIS?: SortOrderInput | SortOrder
    stt?: SortOrder
    buoiKhamId?: SortOrder
    coSoId?: SortOrder
    hoTen?: SortOrder
    gioiTinh?: SortOrder
    ngaySinh?: SortOrderInput | SortOrder
    namSinh?: SortOrder
    cccd?: SortOrderInput | SortOrder
    diaChi?: SortOrderInput | SortOrder
    sdt?: SortOrderInput | SortOrder
    sdtNguoiNha?: SortOrderInput | SortOrder
    thiLucMP?: SortOrderInput | SortOrder
    thiLucMT?: SortOrderInput | SortOrder
    chanDoan?: SortOrder
    chanDoanKhac?: SortOrderInput | SortOrder
    khuyenNghi?: SortOrderInput | SortOrder
    bhyt?: SortOrderInput | SortOrder
    tuVanVienMa?: SortOrderInput | SortOrder
    soTienBao?: SortOrderInput | SortOrder
    ngayDieuTri?: SortOrderInput | SortOrder
    diemDon?: SortOrderInput | SortOrder
    gioDon?: SortOrderInput | SortOrder
    nhom?: SortOrderInput | SortOrder
    followUpStatus?: SortOrderInput | SortOrder
    nguoiPhuTrachMa?: SortOrderInput | SortOrder
    nguoiChotCuoiMa?: SortOrderInput | SortOrder
    ngayChot?: SortOrderInput | SortOrder
    daDon?: SortOrder
    ngayMoThucTe?: SortOrderInput | SortOrder
    soTienThucThu?: SortOrderInput | SortOrder
    trangThaiDieuTri?: SortOrderInput | SortOrder
    ngayTaiKham?: SortOrderInput | SortOrder
    ghiChuMat2?: SortOrderInput | SortOrder
    trangThai?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    createdBy?: SortOrderInput | SortOrder
    updatedBy?: SortOrderInput | SortOrder
    syncStatus?: SortOrder
    buoiKham?: BuoiKhamOrderByWithRelationInput
    coSo?: CoSoOrderByWithRelationInput
    tuVanVien?: NguoiDungCSROrderByWithRelationInput
    nguoiPhuTrach?: NguoiDungCSROrderByWithRelationInput
    nguoiChotCuoi?: NguoiDungCSROrderByWithRelationInput
    nhatKy?: NhatKyTheoDoiOrderByRelationAggregateInput
  }

  export type HoSoBenhNhanWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    maBN?: string
    AND?: HoSoBenhNhanWhereInput | HoSoBenhNhanWhereInput[]
    OR?: HoSoBenhNhanWhereInput[]
    NOT?: HoSoBenhNhanWhereInput | HoSoBenhNhanWhereInput[]
    maBNHIS?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    stt?: IntFilter<"HoSoBenhNhan"> | number
    buoiKhamId?: StringFilter<"HoSoBenhNhan"> | string
    coSoId?: StringFilter<"HoSoBenhNhan"> | string
    hoTen?: StringFilter<"HoSoBenhNhan"> | string
    gioiTinh?: StringFilter<"HoSoBenhNhan"> | string
    ngaySinh?: DateTimeNullableFilter<"HoSoBenhNhan"> | Date | string | null
    namSinh?: IntFilter<"HoSoBenhNhan"> | number
    cccd?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    diaChi?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    sdt?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    sdtNguoiNha?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    thiLucMP?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    thiLucMT?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    chanDoan?: StringFilter<"HoSoBenhNhan"> | string
    chanDoanKhac?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    khuyenNghi?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    bhyt?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    tuVanVienMa?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    soTienBao?: FloatNullableFilter<"HoSoBenhNhan"> | number | null
    ngayDieuTri?: DateTimeNullableFilter<"HoSoBenhNhan"> | Date | string | null
    diemDon?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    gioDon?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    nhom?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    followUpStatus?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    nguoiPhuTrachMa?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    nguoiChotCuoiMa?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    ngayChot?: DateTimeNullableFilter<"HoSoBenhNhan"> | Date | string | null
    daDon?: BoolFilter<"HoSoBenhNhan"> | boolean
    ngayMoThucTe?: DateTimeNullableFilter<"HoSoBenhNhan"> | Date | string | null
    soTienThucThu?: FloatNullableFilter<"HoSoBenhNhan"> | number | null
    trangThaiDieuTri?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    ngayTaiKham?: DateTimeNullableFilter<"HoSoBenhNhan"> | Date | string | null
    ghiChuMat2?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    trangThai?: StringFilter<"HoSoBenhNhan"> | string
    createdAt?: DateTimeFilter<"HoSoBenhNhan"> | Date | string
    updatedAt?: DateTimeFilter<"HoSoBenhNhan"> | Date | string
    createdBy?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    updatedBy?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    syncStatus?: StringFilter<"HoSoBenhNhan"> | string
    buoiKham?: XOR<BuoiKhamScalarRelationFilter, BuoiKhamWhereInput>
    coSo?: XOR<CoSoScalarRelationFilter, CoSoWhereInput>
    tuVanVien?: XOR<NguoiDungCSRNullableScalarRelationFilter, NguoiDungCSRWhereInput> | null
    nguoiPhuTrach?: XOR<NguoiDungCSRNullableScalarRelationFilter, NguoiDungCSRWhereInput> | null
    nguoiChotCuoi?: XOR<NguoiDungCSRNullableScalarRelationFilter, NguoiDungCSRWhereInput> | null
    nhatKy?: NhatKyTheoDoiListRelationFilter
  }, "id" | "maBN">

  export type HoSoBenhNhanOrderByWithAggregationInput = {
    id?: SortOrder
    maBN?: SortOrder
    maBNHIS?: SortOrderInput | SortOrder
    stt?: SortOrder
    buoiKhamId?: SortOrder
    coSoId?: SortOrder
    hoTen?: SortOrder
    gioiTinh?: SortOrder
    ngaySinh?: SortOrderInput | SortOrder
    namSinh?: SortOrder
    cccd?: SortOrderInput | SortOrder
    diaChi?: SortOrderInput | SortOrder
    sdt?: SortOrderInput | SortOrder
    sdtNguoiNha?: SortOrderInput | SortOrder
    thiLucMP?: SortOrderInput | SortOrder
    thiLucMT?: SortOrderInput | SortOrder
    chanDoan?: SortOrder
    chanDoanKhac?: SortOrderInput | SortOrder
    khuyenNghi?: SortOrderInput | SortOrder
    bhyt?: SortOrderInput | SortOrder
    tuVanVienMa?: SortOrderInput | SortOrder
    soTienBao?: SortOrderInput | SortOrder
    ngayDieuTri?: SortOrderInput | SortOrder
    diemDon?: SortOrderInput | SortOrder
    gioDon?: SortOrderInput | SortOrder
    nhom?: SortOrderInput | SortOrder
    followUpStatus?: SortOrderInput | SortOrder
    nguoiPhuTrachMa?: SortOrderInput | SortOrder
    nguoiChotCuoiMa?: SortOrderInput | SortOrder
    ngayChot?: SortOrderInput | SortOrder
    daDon?: SortOrder
    ngayMoThucTe?: SortOrderInput | SortOrder
    soTienThucThu?: SortOrderInput | SortOrder
    trangThaiDieuTri?: SortOrderInput | SortOrder
    ngayTaiKham?: SortOrderInput | SortOrder
    ghiChuMat2?: SortOrderInput | SortOrder
    trangThai?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    createdBy?: SortOrderInput | SortOrder
    updatedBy?: SortOrderInput | SortOrder
    syncStatus?: SortOrder
    _count?: HoSoBenhNhanCountOrderByAggregateInput
    _avg?: HoSoBenhNhanAvgOrderByAggregateInput
    _max?: HoSoBenhNhanMaxOrderByAggregateInput
    _min?: HoSoBenhNhanMinOrderByAggregateInput
    _sum?: HoSoBenhNhanSumOrderByAggregateInput
  }

  export type HoSoBenhNhanScalarWhereWithAggregatesInput = {
    AND?: HoSoBenhNhanScalarWhereWithAggregatesInput | HoSoBenhNhanScalarWhereWithAggregatesInput[]
    OR?: HoSoBenhNhanScalarWhereWithAggregatesInput[]
    NOT?: HoSoBenhNhanScalarWhereWithAggregatesInput | HoSoBenhNhanScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"HoSoBenhNhan"> | string
    maBN?: StringWithAggregatesFilter<"HoSoBenhNhan"> | string
    maBNHIS?: StringNullableWithAggregatesFilter<"HoSoBenhNhan"> | string | null
    stt?: IntWithAggregatesFilter<"HoSoBenhNhan"> | number
    buoiKhamId?: StringWithAggregatesFilter<"HoSoBenhNhan"> | string
    coSoId?: StringWithAggregatesFilter<"HoSoBenhNhan"> | string
    hoTen?: StringWithAggregatesFilter<"HoSoBenhNhan"> | string
    gioiTinh?: StringWithAggregatesFilter<"HoSoBenhNhan"> | string
    ngaySinh?: DateTimeNullableWithAggregatesFilter<"HoSoBenhNhan"> | Date | string | null
    namSinh?: IntWithAggregatesFilter<"HoSoBenhNhan"> | number
    cccd?: StringNullableWithAggregatesFilter<"HoSoBenhNhan"> | string | null
    diaChi?: StringNullableWithAggregatesFilter<"HoSoBenhNhan"> | string | null
    sdt?: StringNullableWithAggregatesFilter<"HoSoBenhNhan"> | string | null
    sdtNguoiNha?: StringNullableWithAggregatesFilter<"HoSoBenhNhan"> | string | null
    thiLucMP?: StringNullableWithAggregatesFilter<"HoSoBenhNhan"> | string | null
    thiLucMT?: StringNullableWithAggregatesFilter<"HoSoBenhNhan"> | string | null
    chanDoan?: StringWithAggregatesFilter<"HoSoBenhNhan"> | string
    chanDoanKhac?: StringNullableWithAggregatesFilter<"HoSoBenhNhan"> | string | null
    khuyenNghi?: StringNullableWithAggregatesFilter<"HoSoBenhNhan"> | string | null
    bhyt?: StringNullableWithAggregatesFilter<"HoSoBenhNhan"> | string | null
    tuVanVienMa?: StringNullableWithAggregatesFilter<"HoSoBenhNhan"> | string | null
    soTienBao?: FloatNullableWithAggregatesFilter<"HoSoBenhNhan"> | number | null
    ngayDieuTri?: DateTimeNullableWithAggregatesFilter<"HoSoBenhNhan"> | Date | string | null
    diemDon?: StringNullableWithAggregatesFilter<"HoSoBenhNhan"> | string | null
    gioDon?: StringNullableWithAggregatesFilter<"HoSoBenhNhan"> | string | null
    nhom?: StringNullableWithAggregatesFilter<"HoSoBenhNhan"> | string | null
    followUpStatus?: StringNullableWithAggregatesFilter<"HoSoBenhNhan"> | string | null
    nguoiPhuTrachMa?: StringNullableWithAggregatesFilter<"HoSoBenhNhan"> | string | null
    nguoiChotCuoiMa?: StringNullableWithAggregatesFilter<"HoSoBenhNhan"> | string | null
    ngayChot?: DateTimeNullableWithAggregatesFilter<"HoSoBenhNhan"> | Date | string | null
    daDon?: BoolWithAggregatesFilter<"HoSoBenhNhan"> | boolean
    ngayMoThucTe?: DateTimeNullableWithAggregatesFilter<"HoSoBenhNhan"> | Date | string | null
    soTienThucThu?: FloatNullableWithAggregatesFilter<"HoSoBenhNhan"> | number | null
    trangThaiDieuTri?: StringNullableWithAggregatesFilter<"HoSoBenhNhan"> | string | null
    ngayTaiKham?: DateTimeNullableWithAggregatesFilter<"HoSoBenhNhan"> | Date | string | null
    ghiChuMat2?: StringNullableWithAggregatesFilter<"HoSoBenhNhan"> | string | null
    trangThai?: StringWithAggregatesFilter<"HoSoBenhNhan"> | string
    createdAt?: DateTimeWithAggregatesFilter<"HoSoBenhNhan"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"HoSoBenhNhan"> | Date | string
    createdBy?: StringNullableWithAggregatesFilter<"HoSoBenhNhan"> | string | null
    updatedBy?: StringNullableWithAggregatesFilter<"HoSoBenhNhan"> | string | null
    syncStatus?: StringWithAggregatesFilter<"HoSoBenhNhan"> | string
  }

  export type NhatKyTheoDoiWhereInput = {
    AND?: NhatKyTheoDoiWhereInput | NhatKyTheoDoiWhereInput[]
    OR?: NhatKyTheoDoiWhereInput[]
    NOT?: NhatKyTheoDoiWhereInput | NhatKyTheoDoiWhereInput[]
    id?: StringFilter<"NhatKyTheoDoi"> | string
    hoSoId?: StringFilter<"NhatKyTheoDoi"> | string
    ngay?: DateTimeFilter<"NhatKyTheoDoi"> | Date | string
    nguoiGoiMa?: StringFilter<"NhatKyTheoDoi"> | string
    noiDung?: StringFilter<"NhatKyTheoDoi"> | string
    syncStatus?: StringFilter<"NhatKyTheoDoi"> | string
    hoSo?: XOR<HoSoBenhNhanScalarRelationFilter, HoSoBenhNhanWhereInput>
    nguoiGoi?: XOR<NguoiDungCSRScalarRelationFilter, NguoiDungCSRWhereInput>
  }

  export type NhatKyTheoDoiOrderByWithRelationInput = {
    id?: SortOrder
    hoSoId?: SortOrder
    ngay?: SortOrder
    nguoiGoiMa?: SortOrder
    noiDung?: SortOrder
    syncStatus?: SortOrder
    hoSo?: HoSoBenhNhanOrderByWithRelationInput
    nguoiGoi?: NguoiDungCSROrderByWithRelationInput
  }

  export type NhatKyTheoDoiWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: NhatKyTheoDoiWhereInput | NhatKyTheoDoiWhereInput[]
    OR?: NhatKyTheoDoiWhereInput[]
    NOT?: NhatKyTheoDoiWhereInput | NhatKyTheoDoiWhereInput[]
    hoSoId?: StringFilter<"NhatKyTheoDoi"> | string
    ngay?: DateTimeFilter<"NhatKyTheoDoi"> | Date | string
    nguoiGoiMa?: StringFilter<"NhatKyTheoDoi"> | string
    noiDung?: StringFilter<"NhatKyTheoDoi"> | string
    syncStatus?: StringFilter<"NhatKyTheoDoi"> | string
    hoSo?: XOR<HoSoBenhNhanScalarRelationFilter, HoSoBenhNhanWhereInput>
    nguoiGoi?: XOR<NguoiDungCSRScalarRelationFilter, NguoiDungCSRWhereInput>
  }, "id">

  export type NhatKyTheoDoiOrderByWithAggregationInput = {
    id?: SortOrder
    hoSoId?: SortOrder
    ngay?: SortOrder
    nguoiGoiMa?: SortOrder
    noiDung?: SortOrder
    syncStatus?: SortOrder
    _count?: NhatKyTheoDoiCountOrderByAggregateInput
    _max?: NhatKyTheoDoiMaxOrderByAggregateInput
    _min?: NhatKyTheoDoiMinOrderByAggregateInput
  }

  export type NhatKyTheoDoiScalarWhereWithAggregatesInput = {
    AND?: NhatKyTheoDoiScalarWhereWithAggregatesInput | NhatKyTheoDoiScalarWhereWithAggregatesInput[]
    OR?: NhatKyTheoDoiScalarWhereWithAggregatesInput[]
    NOT?: NhatKyTheoDoiScalarWhereWithAggregatesInput | NhatKyTheoDoiScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"NhatKyTheoDoi"> | string
    hoSoId?: StringWithAggregatesFilter<"NhatKyTheoDoi"> | string
    ngay?: DateTimeWithAggregatesFilter<"NhatKyTheoDoi"> | Date | string
    nguoiGoiMa?: StringWithAggregatesFilter<"NhatKyTheoDoi"> | string
    noiDung?: StringWithAggregatesFilter<"NhatKyTheoDoi"> | string
    syncStatus?: StringWithAggregatesFilter<"NhatKyTheoDoi"> | string
  }

  export type AuditLogWhereInput = {
    AND?: AuditLogWhereInput | AuditLogWhereInput[]
    OR?: AuditLogWhereInput[]
    NOT?: AuditLogWhereInput | AuditLogWhereInput[]
    id?: IntFilter<"AuditLog"> | number
    bang?: StringFilter<"AuditLog"> | string
    banGhiId?: StringFilter<"AuditLog"> | string
    hanhDong?: StringFilter<"AuditLog"> | string
    nguoiDung?: StringFilter<"AuditLog"> | string
    thoiDiem?: DateTimeFilter<"AuditLog"> | Date | string
    thayDoi?: StringFilter<"AuditLog"> | string
  }

  export type AuditLogOrderByWithRelationInput = {
    id?: SortOrder
    bang?: SortOrder
    banGhiId?: SortOrder
    hanhDong?: SortOrder
    nguoiDung?: SortOrder
    thoiDiem?: SortOrder
    thayDoi?: SortOrder
  }

  export type AuditLogWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: AuditLogWhereInput | AuditLogWhereInput[]
    OR?: AuditLogWhereInput[]
    NOT?: AuditLogWhereInput | AuditLogWhereInput[]
    bang?: StringFilter<"AuditLog"> | string
    banGhiId?: StringFilter<"AuditLog"> | string
    hanhDong?: StringFilter<"AuditLog"> | string
    nguoiDung?: StringFilter<"AuditLog"> | string
    thoiDiem?: DateTimeFilter<"AuditLog"> | Date | string
    thayDoi?: StringFilter<"AuditLog"> | string
  }, "id">

  export type AuditLogOrderByWithAggregationInput = {
    id?: SortOrder
    bang?: SortOrder
    banGhiId?: SortOrder
    hanhDong?: SortOrder
    nguoiDung?: SortOrder
    thoiDiem?: SortOrder
    thayDoi?: SortOrder
    _count?: AuditLogCountOrderByAggregateInput
    _avg?: AuditLogAvgOrderByAggregateInput
    _max?: AuditLogMaxOrderByAggregateInput
    _min?: AuditLogMinOrderByAggregateInput
    _sum?: AuditLogSumOrderByAggregateInput
  }

  export type AuditLogScalarWhereWithAggregatesInput = {
    AND?: AuditLogScalarWhereWithAggregatesInput | AuditLogScalarWhereWithAggregatesInput[]
    OR?: AuditLogScalarWhereWithAggregatesInput[]
    NOT?: AuditLogScalarWhereWithAggregatesInput | AuditLogScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"AuditLog"> | number
    bang?: StringWithAggregatesFilter<"AuditLog"> | string
    banGhiId?: StringWithAggregatesFilter<"AuditLog"> | string
    hanhDong?: StringWithAggregatesFilter<"AuditLog"> | string
    nguoiDung?: StringWithAggregatesFilter<"AuditLog"> | string
    thoiDiem?: DateTimeWithAggregatesFilter<"AuditLog"> | Date | string
    thayDoi?: StringWithAggregatesFilter<"AuditLog"> | string
  }

  export type SyncQueueWhereInput = {
    AND?: SyncQueueWhereInput | SyncQueueWhereInput[]
    OR?: SyncQueueWhereInput[]
    NOT?: SyncQueueWhereInput | SyncQueueWhereInput[]
    id?: IntFilter<"SyncQueue"> | number
    hoSoId?: StringFilter<"SyncQueue"> | string
    createdAt?: DateTimeFilter<"SyncQueue"> | Date | string
    retries?: IntFilter<"SyncQueue"> | number
  }

  export type SyncQueueOrderByWithRelationInput = {
    id?: SortOrder
    hoSoId?: SortOrder
    createdAt?: SortOrder
    retries?: SortOrder
  }

  export type SyncQueueWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: SyncQueueWhereInput | SyncQueueWhereInput[]
    OR?: SyncQueueWhereInput[]
    NOT?: SyncQueueWhereInput | SyncQueueWhereInput[]
    hoSoId?: StringFilter<"SyncQueue"> | string
    createdAt?: DateTimeFilter<"SyncQueue"> | Date | string
    retries?: IntFilter<"SyncQueue"> | number
  }, "id">

  export type SyncQueueOrderByWithAggregationInput = {
    id?: SortOrder
    hoSoId?: SortOrder
    createdAt?: SortOrder
    retries?: SortOrder
    _count?: SyncQueueCountOrderByAggregateInput
    _avg?: SyncQueueAvgOrderByAggregateInput
    _max?: SyncQueueMaxOrderByAggregateInput
    _min?: SyncQueueMinOrderByAggregateInput
    _sum?: SyncQueueSumOrderByAggregateInput
  }

  export type SyncQueueScalarWhereWithAggregatesInput = {
    AND?: SyncQueueScalarWhereWithAggregatesInput | SyncQueueScalarWhereWithAggregatesInput[]
    OR?: SyncQueueScalarWhereWithAggregatesInput[]
    NOT?: SyncQueueScalarWhereWithAggregatesInput | SyncQueueScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"SyncQueue"> | number
    hoSoId?: StringWithAggregatesFilter<"SyncQueue"> | string
    createdAt?: DateTimeWithAggregatesFilter<"SyncQueue"> | Date | string
    retries?: IntWithAggregatesFilter<"SyncQueue"> | number
  }

  export type DanhMucBenhVienWhereInput = {
    AND?: DanhMucBenhVienWhereInput | DanhMucBenhVienWhereInput[]
    OR?: DanhMucBenhVienWhereInput[]
    NOT?: DanhMucBenhVienWhereInput | DanhMucBenhVienWhereInput[]
    id?: IntFilter<"DanhMucBenhVien"> | number
    ten?: StringFilter<"DanhMucBenhVien"> | string
    trangThai?: StringFilter<"DanhMucBenhVien"> | string
  }

  export type DanhMucBenhVienOrderByWithRelationInput = {
    id?: SortOrder
    ten?: SortOrder
    trangThai?: SortOrder
  }

  export type DanhMucBenhVienWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    ten?: string
    AND?: DanhMucBenhVienWhereInput | DanhMucBenhVienWhereInput[]
    OR?: DanhMucBenhVienWhereInput[]
    NOT?: DanhMucBenhVienWhereInput | DanhMucBenhVienWhereInput[]
    trangThai?: StringFilter<"DanhMucBenhVien"> | string
  }, "id" | "ten">

  export type DanhMucBenhVienOrderByWithAggregationInput = {
    id?: SortOrder
    ten?: SortOrder
    trangThai?: SortOrder
    _count?: DanhMucBenhVienCountOrderByAggregateInput
    _avg?: DanhMucBenhVienAvgOrderByAggregateInput
    _max?: DanhMucBenhVienMaxOrderByAggregateInput
    _min?: DanhMucBenhVienMinOrderByAggregateInput
    _sum?: DanhMucBenhVienSumOrderByAggregateInput
  }

  export type DanhMucBenhVienScalarWhereWithAggregatesInput = {
    AND?: DanhMucBenhVienScalarWhereWithAggregatesInput | DanhMucBenhVienScalarWhereWithAggregatesInput[]
    OR?: DanhMucBenhVienScalarWhereWithAggregatesInput[]
    NOT?: DanhMucBenhVienScalarWhereWithAggregatesInput | DanhMucBenhVienScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"DanhMucBenhVien"> | number
    ten?: StringWithAggregatesFilter<"DanhMucBenhVien"> | string
    trangThai?: StringWithAggregatesFilter<"DanhMucBenhVien"> | string
  }

  export type CoSoCreateInput = {
    id: string
    ten: string
    diaChi?: string | null
    trangThai?: string
    sheetId?: string | null
    bhxhUser?: string | null
    bhxhPass?: string | null
    bhxhMaCSKCB?: string | null
    bhxhHoTenCB?: string | null
    bhxhCccdCB?: string | null
    hisHost?: string | null
    hisPort?: string | null
    hisUser?: string | null
    hisPass?: string | null
    hisDbName?: string | null
    buoiKham?: BuoiKhamCreateNestedManyWithoutCoSoInput
    nguoiDung?: NguoiDungCSRCreateNestedManyWithoutCoSoInput
    hoSo?: HoSoBenhNhanCreateNestedManyWithoutCoSoInput
  }

  export type CoSoUncheckedCreateInput = {
    id: string
    ten: string
    diaChi?: string | null
    trangThai?: string
    sheetId?: string | null
    bhxhUser?: string | null
    bhxhPass?: string | null
    bhxhMaCSKCB?: string | null
    bhxhHoTenCB?: string | null
    bhxhCccdCB?: string | null
    hisHost?: string | null
    hisPort?: string | null
    hisUser?: string | null
    hisPass?: string | null
    hisDbName?: string | null
    buoiKham?: BuoiKhamUncheckedCreateNestedManyWithoutCoSoInput
    nguoiDung?: NguoiDungCSRUncheckedCreateNestedManyWithoutCoSoInput
    hoSo?: HoSoBenhNhanUncheckedCreateNestedManyWithoutCoSoInput
  }

  export type CoSoUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    ten?: StringFieldUpdateOperationsInput | string
    diaChi?: NullableStringFieldUpdateOperationsInput | string | null
    trangThai?: StringFieldUpdateOperationsInput | string
    sheetId?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhUser?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhPass?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhMaCSKCB?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhHoTenCB?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhCccdCB?: NullableStringFieldUpdateOperationsInput | string | null
    hisHost?: NullableStringFieldUpdateOperationsInput | string | null
    hisPort?: NullableStringFieldUpdateOperationsInput | string | null
    hisUser?: NullableStringFieldUpdateOperationsInput | string | null
    hisPass?: NullableStringFieldUpdateOperationsInput | string | null
    hisDbName?: NullableStringFieldUpdateOperationsInput | string | null
    buoiKham?: BuoiKhamUpdateManyWithoutCoSoNestedInput
    nguoiDung?: NguoiDungCSRUpdateManyWithoutCoSoNestedInput
    hoSo?: HoSoBenhNhanUpdateManyWithoutCoSoNestedInput
  }

  export type CoSoUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    ten?: StringFieldUpdateOperationsInput | string
    diaChi?: NullableStringFieldUpdateOperationsInput | string | null
    trangThai?: StringFieldUpdateOperationsInput | string
    sheetId?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhUser?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhPass?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhMaCSKCB?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhHoTenCB?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhCccdCB?: NullableStringFieldUpdateOperationsInput | string | null
    hisHost?: NullableStringFieldUpdateOperationsInput | string | null
    hisPort?: NullableStringFieldUpdateOperationsInput | string | null
    hisUser?: NullableStringFieldUpdateOperationsInput | string | null
    hisPass?: NullableStringFieldUpdateOperationsInput | string | null
    hisDbName?: NullableStringFieldUpdateOperationsInput | string | null
    buoiKham?: BuoiKhamUncheckedUpdateManyWithoutCoSoNestedInput
    nguoiDung?: NguoiDungCSRUncheckedUpdateManyWithoutCoSoNestedInput
    hoSo?: HoSoBenhNhanUncheckedUpdateManyWithoutCoSoNestedInput
  }

  export type CoSoCreateManyInput = {
    id: string
    ten: string
    diaChi?: string | null
    trangThai?: string
    sheetId?: string | null
    bhxhUser?: string | null
    bhxhPass?: string | null
    bhxhMaCSKCB?: string | null
    bhxhHoTenCB?: string | null
    bhxhCccdCB?: string | null
    hisHost?: string | null
    hisPort?: string | null
    hisUser?: string | null
    hisPass?: string | null
    hisDbName?: string | null
  }

  export type CoSoUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    ten?: StringFieldUpdateOperationsInput | string
    diaChi?: NullableStringFieldUpdateOperationsInput | string | null
    trangThai?: StringFieldUpdateOperationsInput | string
    sheetId?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhUser?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhPass?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhMaCSKCB?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhHoTenCB?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhCccdCB?: NullableStringFieldUpdateOperationsInput | string | null
    hisHost?: NullableStringFieldUpdateOperationsInput | string | null
    hisPort?: NullableStringFieldUpdateOperationsInput | string | null
    hisUser?: NullableStringFieldUpdateOperationsInput | string | null
    hisPass?: NullableStringFieldUpdateOperationsInput | string | null
    hisDbName?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type CoSoUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    ten?: StringFieldUpdateOperationsInput | string
    diaChi?: NullableStringFieldUpdateOperationsInput | string | null
    trangThai?: StringFieldUpdateOperationsInput | string
    sheetId?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhUser?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhPass?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhMaCSKCB?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhHoTenCB?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhCccdCB?: NullableStringFieldUpdateOperationsInput | string | null
    hisHost?: NullableStringFieldUpdateOperationsInput | string | null
    hisPort?: NullableStringFieldUpdateOperationsInput | string | null
    hisUser?: NullableStringFieldUpdateOperationsInput | string | null
    hisPass?: NullableStringFieldUpdateOperationsInput | string | null
    hisDbName?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type NguoiDungCSRCreateInput = {
    maNV: string
    hoTen: string
    vaiTro: string
    tenDangNhap: string
    matKhauHash: string
    trangThai?: string
    coSo?: CoSoCreateNestedOneWithoutNguoiDungInput
    buoiKhamTao?: BuoiKhamCreateNestedManyWithoutNguoiTaoRefInput
    hoSoTuVan?: HoSoBenhNhanCreateNestedManyWithoutTuVanVienInput
    hoSoPhuTrach?: HoSoBenhNhanCreateNestedManyWithoutNguoiPhuTrachInput
    hoSoChotCuoi?: HoSoBenhNhanCreateNestedManyWithoutNguoiChotCuoiInput
    nhatKy?: NhatKyTheoDoiCreateNestedManyWithoutNguoiGoiInput
  }

  export type NguoiDungCSRUncheckedCreateInput = {
    maNV: string
    hoTen: string
    vaiTro: string
    coSoId?: string | null
    tenDangNhap: string
    matKhauHash: string
    trangThai?: string
    buoiKhamTao?: BuoiKhamUncheckedCreateNestedManyWithoutNguoiTaoRefInput
    hoSoTuVan?: HoSoBenhNhanUncheckedCreateNestedManyWithoutTuVanVienInput
    hoSoPhuTrach?: HoSoBenhNhanUncheckedCreateNestedManyWithoutNguoiPhuTrachInput
    hoSoChotCuoi?: HoSoBenhNhanUncheckedCreateNestedManyWithoutNguoiChotCuoiInput
    nhatKy?: NhatKyTheoDoiUncheckedCreateNestedManyWithoutNguoiGoiInput
  }

  export type NguoiDungCSRUpdateInput = {
    maNV?: StringFieldUpdateOperationsInput | string
    hoTen?: StringFieldUpdateOperationsInput | string
    vaiTro?: StringFieldUpdateOperationsInput | string
    tenDangNhap?: StringFieldUpdateOperationsInput | string
    matKhauHash?: StringFieldUpdateOperationsInput | string
    trangThai?: StringFieldUpdateOperationsInput | string
    coSo?: CoSoUpdateOneWithoutNguoiDungNestedInput
    buoiKhamTao?: BuoiKhamUpdateManyWithoutNguoiTaoRefNestedInput
    hoSoTuVan?: HoSoBenhNhanUpdateManyWithoutTuVanVienNestedInput
    hoSoPhuTrach?: HoSoBenhNhanUpdateManyWithoutNguoiPhuTrachNestedInput
    hoSoChotCuoi?: HoSoBenhNhanUpdateManyWithoutNguoiChotCuoiNestedInput
    nhatKy?: NhatKyTheoDoiUpdateManyWithoutNguoiGoiNestedInput
  }

  export type NguoiDungCSRUncheckedUpdateInput = {
    maNV?: StringFieldUpdateOperationsInput | string
    hoTen?: StringFieldUpdateOperationsInput | string
    vaiTro?: StringFieldUpdateOperationsInput | string
    coSoId?: NullableStringFieldUpdateOperationsInput | string | null
    tenDangNhap?: StringFieldUpdateOperationsInput | string
    matKhauHash?: StringFieldUpdateOperationsInput | string
    trangThai?: StringFieldUpdateOperationsInput | string
    buoiKhamTao?: BuoiKhamUncheckedUpdateManyWithoutNguoiTaoRefNestedInput
    hoSoTuVan?: HoSoBenhNhanUncheckedUpdateManyWithoutTuVanVienNestedInput
    hoSoPhuTrach?: HoSoBenhNhanUncheckedUpdateManyWithoutNguoiPhuTrachNestedInput
    hoSoChotCuoi?: HoSoBenhNhanUncheckedUpdateManyWithoutNguoiChotCuoiNestedInput
    nhatKy?: NhatKyTheoDoiUncheckedUpdateManyWithoutNguoiGoiNestedInput
  }

  export type NguoiDungCSRCreateManyInput = {
    maNV: string
    hoTen: string
    vaiTro: string
    coSoId?: string | null
    tenDangNhap: string
    matKhauHash: string
    trangThai?: string
  }

  export type NguoiDungCSRUpdateManyMutationInput = {
    maNV?: StringFieldUpdateOperationsInput | string
    hoTen?: StringFieldUpdateOperationsInput | string
    vaiTro?: StringFieldUpdateOperationsInput | string
    tenDangNhap?: StringFieldUpdateOperationsInput | string
    matKhauHash?: StringFieldUpdateOperationsInput | string
    trangThai?: StringFieldUpdateOperationsInput | string
  }

  export type NguoiDungCSRUncheckedUpdateManyInput = {
    maNV?: StringFieldUpdateOperationsInput | string
    hoTen?: StringFieldUpdateOperationsInput | string
    vaiTro?: StringFieldUpdateOperationsInput | string
    coSoId?: NullableStringFieldUpdateOperationsInput | string | null
    tenDangNhap?: StringFieldUpdateOperationsInput | string
    matKhauHash?: StringFieldUpdateOperationsInput | string
    trangThai?: StringFieldUpdateOperationsInput | string
  }

  export type BuoiKhamCreateInput = {
    id?: string
    ngayKham: Date | string
    xa: string
    diaDiem: string
    ghiChu?: string | null
    createdAt?: Date | string
    syncStatus?: string
    coSo: CoSoCreateNestedOneWithoutBuoiKhamInput
    nguoiTaoRef: NguoiDungCSRCreateNestedOneWithoutBuoiKhamTaoInput
    hoSo?: HoSoBenhNhanCreateNestedManyWithoutBuoiKhamInput
  }

  export type BuoiKhamUncheckedCreateInput = {
    id?: string
    coSoId: string
    ngayKham: Date | string
    xa: string
    diaDiem: string
    ghiChu?: string | null
    nguoiTao: string
    createdAt?: Date | string
    syncStatus?: string
    hoSo?: HoSoBenhNhanUncheckedCreateNestedManyWithoutBuoiKhamInput
  }

  export type BuoiKhamUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    ngayKham?: DateTimeFieldUpdateOperationsInput | Date | string
    xa?: StringFieldUpdateOperationsInput | string
    diaDiem?: StringFieldUpdateOperationsInput | string
    ghiChu?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    syncStatus?: StringFieldUpdateOperationsInput | string
    coSo?: CoSoUpdateOneRequiredWithoutBuoiKhamNestedInput
    nguoiTaoRef?: NguoiDungCSRUpdateOneRequiredWithoutBuoiKhamTaoNestedInput
    hoSo?: HoSoBenhNhanUpdateManyWithoutBuoiKhamNestedInput
  }

  export type BuoiKhamUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    coSoId?: StringFieldUpdateOperationsInput | string
    ngayKham?: DateTimeFieldUpdateOperationsInput | Date | string
    xa?: StringFieldUpdateOperationsInput | string
    diaDiem?: StringFieldUpdateOperationsInput | string
    ghiChu?: NullableStringFieldUpdateOperationsInput | string | null
    nguoiTao?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    syncStatus?: StringFieldUpdateOperationsInput | string
    hoSo?: HoSoBenhNhanUncheckedUpdateManyWithoutBuoiKhamNestedInput
  }

  export type BuoiKhamCreateManyInput = {
    id?: string
    coSoId: string
    ngayKham: Date | string
    xa: string
    diaDiem: string
    ghiChu?: string | null
    nguoiTao: string
    createdAt?: Date | string
    syncStatus?: string
  }

  export type BuoiKhamUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    ngayKham?: DateTimeFieldUpdateOperationsInput | Date | string
    xa?: StringFieldUpdateOperationsInput | string
    diaDiem?: StringFieldUpdateOperationsInput | string
    ghiChu?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    syncStatus?: StringFieldUpdateOperationsInput | string
  }

  export type BuoiKhamUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    coSoId?: StringFieldUpdateOperationsInput | string
    ngayKham?: DateTimeFieldUpdateOperationsInput | Date | string
    xa?: StringFieldUpdateOperationsInput | string
    diaDiem?: StringFieldUpdateOperationsInput | string
    ghiChu?: NullableStringFieldUpdateOperationsInput | string | null
    nguoiTao?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    syncStatus?: StringFieldUpdateOperationsInput | string
  }

  export type HoSoBenhNhanCreateInput = {
    id?: string
    maBN: string
    maBNHIS?: string | null
    stt: number
    hoTen: string
    gioiTinh: string
    ngaySinh?: Date | string | null
    namSinh: number
    cccd?: string | null
    diaChi?: string | null
    sdt?: string | null
    sdtNguoiNha?: string | null
    thiLucMP?: string | null
    thiLucMT?: string | null
    chanDoan?: string
    chanDoanKhac?: string | null
    khuyenNghi?: string | null
    bhyt?: string | null
    soTienBao?: number | null
    ngayDieuTri?: Date | string | null
    diemDon?: string | null
    gioDon?: string | null
    nhom?: string | null
    followUpStatus?: string | null
    ngayChot?: Date | string | null
    daDon?: boolean
    ngayMoThucTe?: Date | string | null
    soTienThucThu?: number | null
    trangThaiDieuTri?: string | null
    ngayTaiKham?: Date | string | null
    ghiChuMat2?: string | null
    trangThai?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    createdBy?: string | null
    updatedBy?: string | null
    syncStatus?: string
    buoiKham: BuoiKhamCreateNestedOneWithoutHoSoInput
    coSo: CoSoCreateNestedOneWithoutHoSoInput
    tuVanVien?: NguoiDungCSRCreateNestedOneWithoutHoSoTuVanInput
    nguoiPhuTrach?: NguoiDungCSRCreateNestedOneWithoutHoSoPhuTrachInput
    nguoiChotCuoi?: NguoiDungCSRCreateNestedOneWithoutHoSoChotCuoiInput
    nhatKy?: NhatKyTheoDoiCreateNestedManyWithoutHoSoInput
  }

  export type HoSoBenhNhanUncheckedCreateInput = {
    id?: string
    maBN: string
    maBNHIS?: string | null
    stt: number
    buoiKhamId: string
    coSoId: string
    hoTen: string
    gioiTinh: string
    ngaySinh?: Date | string | null
    namSinh: number
    cccd?: string | null
    diaChi?: string | null
    sdt?: string | null
    sdtNguoiNha?: string | null
    thiLucMP?: string | null
    thiLucMT?: string | null
    chanDoan?: string
    chanDoanKhac?: string | null
    khuyenNghi?: string | null
    bhyt?: string | null
    tuVanVienMa?: string | null
    soTienBao?: number | null
    ngayDieuTri?: Date | string | null
    diemDon?: string | null
    gioDon?: string | null
    nhom?: string | null
    followUpStatus?: string | null
    nguoiPhuTrachMa?: string | null
    nguoiChotCuoiMa?: string | null
    ngayChot?: Date | string | null
    daDon?: boolean
    ngayMoThucTe?: Date | string | null
    soTienThucThu?: number | null
    trangThaiDieuTri?: string | null
    ngayTaiKham?: Date | string | null
    ghiChuMat2?: string | null
    trangThai?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    createdBy?: string | null
    updatedBy?: string | null
    syncStatus?: string
    nhatKy?: NhatKyTheoDoiUncheckedCreateNestedManyWithoutHoSoInput
  }

  export type HoSoBenhNhanUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    maBN?: StringFieldUpdateOperationsInput | string
    maBNHIS?: NullableStringFieldUpdateOperationsInput | string | null
    stt?: IntFieldUpdateOperationsInput | number
    hoTen?: StringFieldUpdateOperationsInput | string
    gioiTinh?: StringFieldUpdateOperationsInput | string
    ngaySinh?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    namSinh?: IntFieldUpdateOperationsInput | number
    cccd?: NullableStringFieldUpdateOperationsInput | string | null
    diaChi?: NullableStringFieldUpdateOperationsInput | string | null
    sdt?: NullableStringFieldUpdateOperationsInput | string | null
    sdtNguoiNha?: NullableStringFieldUpdateOperationsInput | string | null
    thiLucMP?: NullableStringFieldUpdateOperationsInput | string | null
    thiLucMT?: NullableStringFieldUpdateOperationsInput | string | null
    chanDoan?: StringFieldUpdateOperationsInput | string
    chanDoanKhac?: NullableStringFieldUpdateOperationsInput | string | null
    khuyenNghi?: NullableStringFieldUpdateOperationsInput | string | null
    bhyt?: NullableStringFieldUpdateOperationsInput | string | null
    soTienBao?: NullableFloatFieldUpdateOperationsInput | number | null
    ngayDieuTri?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    diemDon?: NullableStringFieldUpdateOperationsInput | string | null
    gioDon?: NullableStringFieldUpdateOperationsInput | string | null
    nhom?: NullableStringFieldUpdateOperationsInput | string | null
    followUpStatus?: NullableStringFieldUpdateOperationsInput | string | null
    ngayChot?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    daDon?: BoolFieldUpdateOperationsInput | boolean
    ngayMoThucTe?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    soTienThucThu?: NullableFloatFieldUpdateOperationsInput | number | null
    trangThaiDieuTri?: NullableStringFieldUpdateOperationsInput | string | null
    ngayTaiKham?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    ghiChuMat2?: NullableStringFieldUpdateOperationsInput | string | null
    trangThai?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    updatedBy?: NullableStringFieldUpdateOperationsInput | string | null
    syncStatus?: StringFieldUpdateOperationsInput | string
    buoiKham?: BuoiKhamUpdateOneRequiredWithoutHoSoNestedInput
    coSo?: CoSoUpdateOneRequiredWithoutHoSoNestedInput
    tuVanVien?: NguoiDungCSRUpdateOneWithoutHoSoTuVanNestedInput
    nguoiPhuTrach?: NguoiDungCSRUpdateOneWithoutHoSoPhuTrachNestedInput
    nguoiChotCuoi?: NguoiDungCSRUpdateOneWithoutHoSoChotCuoiNestedInput
    nhatKy?: NhatKyTheoDoiUpdateManyWithoutHoSoNestedInput
  }

  export type HoSoBenhNhanUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    maBN?: StringFieldUpdateOperationsInput | string
    maBNHIS?: NullableStringFieldUpdateOperationsInput | string | null
    stt?: IntFieldUpdateOperationsInput | number
    buoiKhamId?: StringFieldUpdateOperationsInput | string
    coSoId?: StringFieldUpdateOperationsInput | string
    hoTen?: StringFieldUpdateOperationsInput | string
    gioiTinh?: StringFieldUpdateOperationsInput | string
    ngaySinh?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    namSinh?: IntFieldUpdateOperationsInput | number
    cccd?: NullableStringFieldUpdateOperationsInput | string | null
    diaChi?: NullableStringFieldUpdateOperationsInput | string | null
    sdt?: NullableStringFieldUpdateOperationsInput | string | null
    sdtNguoiNha?: NullableStringFieldUpdateOperationsInput | string | null
    thiLucMP?: NullableStringFieldUpdateOperationsInput | string | null
    thiLucMT?: NullableStringFieldUpdateOperationsInput | string | null
    chanDoan?: StringFieldUpdateOperationsInput | string
    chanDoanKhac?: NullableStringFieldUpdateOperationsInput | string | null
    khuyenNghi?: NullableStringFieldUpdateOperationsInput | string | null
    bhyt?: NullableStringFieldUpdateOperationsInput | string | null
    tuVanVienMa?: NullableStringFieldUpdateOperationsInput | string | null
    soTienBao?: NullableFloatFieldUpdateOperationsInput | number | null
    ngayDieuTri?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    diemDon?: NullableStringFieldUpdateOperationsInput | string | null
    gioDon?: NullableStringFieldUpdateOperationsInput | string | null
    nhom?: NullableStringFieldUpdateOperationsInput | string | null
    followUpStatus?: NullableStringFieldUpdateOperationsInput | string | null
    nguoiPhuTrachMa?: NullableStringFieldUpdateOperationsInput | string | null
    nguoiChotCuoiMa?: NullableStringFieldUpdateOperationsInput | string | null
    ngayChot?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    daDon?: BoolFieldUpdateOperationsInput | boolean
    ngayMoThucTe?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    soTienThucThu?: NullableFloatFieldUpdateOperationsInput | number | null
    trangThaiDieuTri?: NullableStringFieldUpdateOperationsInput | string | null
    ngayTaiKham?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    ghiChuMat2?: NullableStringFieldUpdateOperationsInput | string | null
    trangThai?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    updatedBy?: NullableStringFieldUpdateOperationsInput | string | null
    syncStatus?: StringFieldUpdateOperationsInput | string
    nhatKy?: NhatKyTheoDoiUncheckedUpdateManyWithoutHoSoNestedInput
  }

  export type HoSoBenhNhanCreateManyInput = {
    id?: string
    maBN: string
    maBNHIS?: string | null
    stt: number
    buoiKhamId: string
    coSoId: string
    hoTen: string
    gioiTinh: string
    ngaySinh?: Date | string | null
    namSinh: number
    cccd?: string | null
    diaChi?: string | null
    sdt?: string | null
    sdtNguoiNha?: string | null
    thiLucMP?: string | null
    thiLucMT?: string | null
    chanDoan?: string
    chanDoanKhac?: string | null
    khuyenNghi?: string | null
    bhyt?: string | null
    tuVanVienMa?: string | null
    soTienBao?: number | null
    ngayDieuTri?: Date | string | null
    diemDon?: string | null
    gioDon?: string | null
    nhom?: string | null
    followUpStatus?: string | null
    nguoiPhuTrachMa?: string | null
    nguoiChotCuoiMa?: string | null
    ngayChot?: Date | string | null
    daDon?: boolean
    ngayMoThucTe?: Date | string | null
    soTienThucThu?: number | null
    trangThaiDieuTri?: string | null
    ngayTaiKham?: Date | string | null
    ghiChuMat2?: string | null
    trangThai?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    createdBy?: string | null
    updatedBy?: string | null
    syncStatus?: string
  }

  export type HoSoBenhNhanUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    maBN?: StringFieldUpdateOperationsInput | string
    maBNHIS?: NullableStringFieldUpdateOperationsInput | string | null
    stt?: IntFieldUpdateOperationsInput | number
    hoTen?: StringFieldUpdateOperationsInput | string
    gioiTinh?: StringFieldUpdateOperationsInput | string
    ngaySinh?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    namSinh?: IntFieldUpdateOperationsInput | number
    cccd?: NullableStringFieldUpdateOperationsInput | string | null
    diaChi?: NullableStringFieldUpdateOperationsInput | string | null
    sdt?: NullableStringFieldUpdateOperationsInput | string | null
    sdtNguoiNha?: NullableStringFieldUpdateOperationsInput | string | null
    thiLucMP?: NullableStringFieldUpdateOperationsInput | string | null
    thiLucMT?: NullableStringFieldUpdateOperationsInput | string | null
    chanDoan?: StringFieldUpdateOperationsInput | string
    chanDoanKhac?: NullableStringFieldUpdateOperationsInput | string | null
    khuyenNghi?: NullableStringFieldUpdateOperationsInput | string | null
    bhyt?: NullableStringFieldUpdateOperationsInput | string | null
    soTienBao?: NullableFloatFieldUpdateOperationsInput | number | null
    ngayDieuTri?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    diemDon?: NullableStringFieldUpdateOperationsInput | string | null
    gioDon?: NullableStringFieldUpdateOperationsInput | string | null
    nhom?: NullableStringFieldUpdateOperationsInput | string | null
    followUpStatus?: NullableStringFieldUpdateOperationsInput | string | null
    ngayChot?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    daDon?: BoolFieldUpdateOperationsInput | boolean
    ngayMoThucTe?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    soTienThucThu?: NullableFloatFieldUpdateOperationsInput | number | null
    trangThaiDieuTri?: NullableStringFieldUpdateOperationsInput | string | null
    ngayTaiKham?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    ghiChuMat2?: NullableStringFieldUpdateOperationsInput | string | null
    trangThai?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    updatedBy?: NullableStringFieldUpdateOperationsInput | string | null
    syncStatus?: StringFieldUpdateOperationsInput | string
  }

  export type HoSoBenhNhanUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    maBN?: StringFieldUpdateOperationsInput | string
    maBNHIS?: NullableStringFieldUpdateOperationsInput | string | null
    stt?: IntFieldUpdateOperationsInput | number
    buoiKhamId?: StringFieldUpdateOperationsInput | string
    coSoId?: StringFieldUpdateOperationsInput | string
    hoTen?: StringFieldUpdateOperationsInput | string
    gioiTinh?: StringFieldUpdateOperationsInput | string
    ngaySinh?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    namSinh?: IntFieldUpdateOperationsInput | number
    cccd?: NullableStringFieldUpdateOperationsInput | string | null
    diaChi?: NullableStringFieldUpdateOperationsInput | string | null
    sdt?: NullableStringFieldUpdateOperationsInput | string | null
    sdtNguoiNha?: NullableStringFieldUpdateOperationsInput | string | null
    thiLucMP?: NullableStringFieldUpdateOperationsInput | string | null
    thiLucMT?: NullableStringFieldUpdateOperationsInput | string | null
    chanDoan?: StringFieldUpdateOperationsInput | string
    chanDoanKhac?: NullableStringFieldUpdateOperationsInput | string | null
    khuyenNghi?: NullableStringFieldUpdateOperationsInput | string | null
    bhyt?: NullableStringFieldUpdateOperationsInput | string | null
    tuVanVienMa?: NullableStringFieldUpdateOperationsInput | string | null
    soTienBao?: NullableFloatFieldUpdateOperationsInput | number | null
    ngayDieuTri?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    diemDon?: NullableStringFieldUpdateOperationsInput | string | null
    gioDon?: NullableStringFieldUpdateOperationsInput | string | null
    nhom?: NullableStringFieldUpdateOperationsInput | string | null
    followUpStatus?: NullableStringFieldUpdateOperationsInput | string | null
    nguoiPhuTrachMa?: NullableStringFieldUpdateOperationsInput | string | null
    nguoiChotCuoiMa?: NullableStringFieldUpdateOperationsInput | string | null
    ngayChot?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    daDon?: BoolFieldUpdateOperationsInput | boolean
    ngayMoThucTe?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    soTienThucThu?: NullableFloatFieldUpdateOperationsInput | number | null
    trangThaiDieuTri?: NullableStringFieldUpdateOperationsInput | string | null
    ngayTaiKham?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    ghiChuMat2?: NullableStringFieldUpdateOperationsInput | string | null
    trangThai?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    updatedBy?: NullableStringFieldUpdateOperationsInput | string | null
    syncStatus?: StringFieldUpdateOperationsInput | string
  }

  export type NhatKyTheoDoiCreateInput = {
    id?: string
    ngay: Date | string
    noiDung: string
    syncStatus?: string
    hoSo: HoSoBenhNhanCreateNestedOneWithoutNhatKyInput
    nguoiGoi: NguoiDungCSRCreateNestedOneWithoutNhatKyInput
  }

  export type NhatKyTheoDoiUncheckedCreateInput = {
    id?: string
    hoSoId: string
    ngay: Date | string
    nguoiGoiMa: string
    noiDung: string
    syncStatus?: string
  }

  export type NhatKyTheoDoiUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    ngay?: DateTimeFieldUpdateOperationsInput | Date | string
    noiDung?: StringFieldUpdateOperationsInput | string
    syncStatus?: StringFieldUpdateOperationsInput | string
    hoSo?: HoSoBenhNhanUpdateOneRequiredWithoutNhatKyNestedInput
    nguoiGoi?: NguoiDungCSRUpdateOneRequiredWithoutNhatKyNestedInput
  }

  export type NhatKyTheoDoiUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    hoSoId?: StringFieldUpdateOperationsInput | string
    ngay?: DateTimeFieldUpdateOperationsInput | Date | string
    nguoiGoiMa?: StringFieldUpdateOperationsInput | string
    noiDung?: StringFieldUpdateOperationsInput | string
    syncStatus?: StringFieldUpdateOperationsInput | string
  }

  export type NhatKyTheoDoiCreateManyInput = {
    id?: string
    hoSoId: string
    ngay: Date | string
    nguoiGoiMa: string
    noiDung: string
    syncStatus?: string
  }

  export type NhatKyTheoDoiUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    ngay?: DateTimeFieldUpdateOperationsInput | Date | string
    noiDung?: StringFieldUpdateOperationsInput | string
    syncStatus?: StringFieldUpdateOperationsInput | string
  }

  export type NhatKyTheoDoiUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    hoSoId?: StringFieldUpdateOperationsInput | string
    ngay?: DateTimeFieldUpdateOperationsInput | Date | string
    nguoiGoiMa?: StringFieldUpdateOperationsInput | string
    noiDung?: StringFieldUpdateOperationsInput | string
    syncStatus?: StringFieldUpdateOperationsInput | string
  }

  export type AuditLogCreateInput = {
    bang: string
    banGhiId: string
    hanhDong: string
    nguoiDung: string
    thoiDiem?: Date | string
    thayDoi: string
  }

  export type AuditLogUncheckedCreateInput = {
    id?: number
    bang: string
    banGhiId: string
    hanhDong: string
    nguoiDung: string
    thoiDiem?: Date | string
    thayDoi: string
  }

  export type AuditLogUpdateInput = {
    bang?: StringFieldUpdateOperationsInput | string
    banGhiId?: StringFieldUpdateOperationsInput | string
    hanhDong?: StringFieldUpdateOperationsInput | string
    nguoiDung?: StringFieldUpdateOperationsInput | string
    thoiDiem?: DateTimeFieldUpdateOperationsInput | Date | string
    thayDoi?: StringFieldUpdateOperationsInput | string
  }

  export type AuditLogUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    bang?: StringFieldUpdateOperationsInput | string
    banGhiId?: StringFieldUpdateOperationsInput | string
    hanhDong?: StringFieldUpdateOperationsInput | string
    nguoiDung?: StringFieldUpdateOperationsInput | string
    thoiDiem?: DateTimeFieldUpdateOperationsInput | Date | string
    thayDoi?: StringFieldUpdateOperationsInput | string
  }

  export type AuditLogCreateManyInput = {
    id?: number
    bang: string
    banGhiId: string
    hanhDong: string
    nguoiDung: string
    thoiDiem?: Date | string
    thayDoi: string
  }

  export type AuditLogUpdateManyMutationInput = {
    bang?: StringFieldUpdateOperationsInput | string
    banGhiId?: StringFieldUpdateOperationsInput | string
    hanhDong?: StringFieldUpdateOperationsInput | string
    nguoiDung?: StringFieldUpdateOperationsInput | string
    thoiDiem?: DateTimeFieldUpdateOperationsInput | Date | string
    thayDoi?: StringFieldUpdateOperationsInput | string
  }

  export type AuditLogUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    bang?: StringFieldUpdateOperationsInput | string
    banGhiId?: StringFieldUpdateOperationsInput | string
    hanhDong?: StringFieldUpdateOperationsInput | string
    nguoiDung?: StringFieldUpdateOperationsInput | string
    thoiDiem?: DateTimeFieldUpdateOperationsInput | Date | string
    thayDoi?: StringFieldUpdateOperationsInput | string
  }

  export type SyncQueueCreateInput = {
    hoSoId: string
    createdAt?: Date | string
    retries?: number
  }

  export type SyncQueueUncheckedCreateInput = {
    id?: number
    hoSoId: string
    createdAt?: Date | string
    retries?: number
  }

  export type SyncQueueUpdateInput = {
    hoSoId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    retries?: IntFieldUpdateOperationsInput | number
  }

  export type SyncQueueUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    hoSoId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    retries?: IntFieldUpdateOperationsInput | number
  }

  export type SyncQueueCreateManyInput = {
    id?: number
    hoSoId: string
    createdAt?: Date | string
    retries?: number
  }

  export type SyncQueueUpdateManyMutationInput = {
    hoSoId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    retries?: IntFieldUpdateOperationsInput | number
  }

  export type SyncQueueUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    hoSoId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    retries?: IntFieldUpdateOperationsInput | number
  }

  export type DanhMucBenhVienCreateInput = {
    ten: string
    trangThai?: string
  }

  export type DanhMucBenhVienUncheckedCreateInput = {
    id?: number
    ten: string
    trangThai?: string
  }

  export type DanhMucBenhVienUpdateInput = {
    ten?: StringFieldUpdateOperationsInput | string
    trangThai?: StringFieldUpdateOperationsInput | string
  }

  export type DanhMucBenhVienUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    ten?: StringFieldUpdateOperationsInput | string
    trangThai?: StringFieldUpdateOperationsInput | string
  }

  export type DanhMucBenhVienCreateManyInput = {
    id?: number
    ten: string
    trangThai?: string
  }

  export type DanhMucBenhVienUpdateManyMutationInput = {
    ten?: StringFieldUpdateOperationsInput | string
    trangThai?: StringFieldUpdateOperationsInput | string
  }

  export type DanhMucBenhVienUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    ten?: StringFieldUpdateOperationsInput | string
    trangThai?: StringFieldUpdateOperationsInput | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type BuoiKhamListRelationFilter = {
    every?: BuoiKhamWhereInput
    some?: BuoiKhamWhereInput
    none?: BuoiKhamWhereInput
  }

  export type NguoiDungCSRListRelationFilter = {
    every?: NguoiDungCSRWhereInput
    some?: NguoiDungCSRWhereInput
    none?: NguoiDungCSRWhereInput
  }

  export type HoSoBenhNhanListRelationFilter = {
    every?: HoSoBenhNhanWhereInput
    some?: HoSoBenhNhanWhereInput
    none?: HoSoBenhNhanWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type BuoiKhamOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type NguoiDungCSROrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type HoSoBenhNhanOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type CoSoCountOrderByAggregateInput = {
    id?: SortOrder
    ten?: SortOrder
    diaChi?: SortOrder
    trangThai?: SortOrder
    sheetId?: SortOrder
    bhxhUser?: SortOrder
    bhxhPass?: SortOrder
    bhxhMaCSKCB?: SortOrder
    bhxhHoTenCB?: SortOrder
    bhxhCccdCB?: SortOrder
    hisHost?: SortOrder
    hisPort?: SortOrder
    hisUser?: SortOrder
    hisPass?: SortOrder
    hisDbName?: SortOrder
  }

  export type CoSoMaxOrderByAggregateInput = {
    id?: SortOrder
    ten?: SortOrder
    diaChi?: SortOrder
    trangThai?: SortOrder
    sheetId?: SortOrder
    bhxhUser?: SortOrder
    bhxhPass?: SortOrder
    bhxhMaCSKCB?: SortOrder
    bhxhHoTenCB?: SortOrder
    bhxhCccdCB?: SortOrder
    hisHost?: SortOrder
    hisPort?: SortOrder
    hisUser?: SortOrder
    hisPass?: SortOrder
    hisDbName?: SortOrder
  }

  export type CoSoMinOrderByAggregateInput = {
    id?: SortOrder
    ten?: SortOrder
    diaChi?: SortOrder
    trangThai?: SortOrder
    sheetId?: SortOrder
    bhxhUser?: SortOrder
    bhxhPass?: SortOrder
    bhxhMaCSKCB?: SortOrder
    bhxhHoTenCB?: SortOrder
    bhxhCccdCB?: SortOrder
    hisHost?: SortOrder
    hisPort?: SortOrder
    hisUser?: SortOrder
    hisPass?: SortOrder
    hisDbName?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type CoSoNullableScalarRelationFilter = {
    is?: CoSoWhereInput | null
    isNot?: CoSoWhereInput | null
  }

  export type NhatKyTheoDoiListRelationFilter = {
    every?: NhatKyTheoDoiWhereInput
    some?: NhatKyTheoDoiWhereInput
    none?: NhatKyTheoDoiWhereInput
  }

  export type NhatKyTheoDoiOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type NguoiDungCSRCountOrderByAggregateInput = {
    maNV?: SortOrder
    hoTen?: SortOrder
    vaiTro?: SortOrder
    coSoId?: SortOrder
    tenDangNhap?: SortOrder
    matKhauHash?: SortOrder
    trangThai?: SortOrder
  }

  export type NguoiDungCSRMaxOrderByAggregateInput = {
    maNV?: SortOrder
    hoTen?: SortOrder
    vaiTro?: SortOrder
    coSoId?: SortOrder
    tenDangNhap?: SortOrder
    matKhauHash?: SortOrder
    trangThai?: SortOrder
  }

  export type NguoiDungCSRMinOrderByAggregateInput = {
    maNV?: SortOrder
    hoTen?: SortOrder
    vaiTro?: SortOrder
    coSoId?: SortOrder
    tenDangNhap?: SortOrder
    matKhauHash?: SortOrder
    trangThai?: SortOrder
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type CoSoScalarRelationFilter = {
    is?: CoSoWhereInput
    isNot?: CoSoWhereInput
  }

  export type NguoiDungCSRScalarRelationFilter = {
    is?: NguoiDungCSRWhereInput
    isNot?: NguoiDungCSRWhereInput
  }

  export type BuoiKhamCountOrderByAggregateInput = {
    id?: SortOrder
    coSoId?: SortOrder
    ngayKham?: SortOrder
    xa?: SortOrder
    diaDiem?: SortOrder
    ghiChu?: SortOrder
    nguoiTao?: SortOrder
    createdAt?: SortOrder
    syncStatus?: SortOrder
  }

  export type BuoiKhamMaxOrderByAggregateInput = {
    id?: SortOrder
    coSoId?: SortOrder
    ngayKham?: SortOrder
    xa?: SortOrder
    diaDiem?: SortOrder
    ghiChu?: SortOrder
    nguoiTao?: SortOrder
    createdAt?: SortOrder
    syncStatus?: SortOrder
  }

  export type BuoiKhamMinOrderByAggregateInput = {
    id?: SortOrder
    coSoId?: SortOrder
    ngayKham?: SortOrder
    xa?: SortOrder
    diaDiem?: SortOrder
    ghiChu?: SortOrder
    nguoiTao?: SortOrder
    createdAt?: SortOrder
    syncStatus?: SortOrder
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type FloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type BuoiKhamScalarRelationFilter = {
    is?: BuoiKhamWhereInput
    isNot?: BuoiKhamWhereInput
  }

  export type NguoiDungCSRNullableScalarRelationFilter = {
    is?: NguoiDungCSRWhereInput | null
    isNot?: NguoiDungCSRWhereInput | null
  }

  export type HoSoBenhNhanCountOrderByAggregateInput = {
    id?: SortOrder
    maBN?: SortOrder
    maBNHIS?: SortOrder
    stt?: SortOrder
    buoiKhamId?: SortOrder
    coSoId?: SortOrder
    hoTen?: SortOrder
    gioiTinh?: SortOrder
    ngaySinh?: SortOrder
    namSinh?: SortOrder
    cccd?: SortOrder
    diaChi?: SortOrder
    sdt?: SortOrder
    sdtNguoiNha?: SortOrder
    thiLucMP?: SortOrder
    thiLucMT?: SortOrder
    chanDoan?: SortOrder
    chanDoanKhac?: SortOrder
    khuyenNghi?: SortOrder
    bhyt?: SortOrder
    tuVanVienMa?: SortOrder
    soTienBao?: SortOrder
    ngayDieuTri?: SortOrder
    diemDon?: SortOrder
    gioDon?: SortOrder
    nhom?: SortOrder
    followUpStatus?: SortOrder
    nguoiPhuTrachMa?: SortOrder
    nguoiChotCuoiMa?: SortOrder
    ngayChot?: SortOrder
    daDon?: SortOrder
    ngayMoThucTe?: SortOrder
    soTienThucThu?: SortOrder
    trangThaiDieuTri?: SortOrder
    ngayTaiKham?: SortOrder
    ghiChuMat2?: SortOrder
    trangThai?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    createdBy?: SortOrder
    updatedBy?: SortOrder
    syncStatus?: SortOrder
  }

  export type HoSoBenhNhanAvgOrderByAggregateInput = {
    stt?: SortOrder
    namSinh?: SortOrder
    soTienBao?: SortOrder
    soTienThucThu?: SortOrder
  }

  export type HoSoBenhNhanMaxOrderByAggregateInput = {
    id?: SortOrder
    maBN?: SortOrder
    maBNHIS?: SortOrder
    stt?: SortOrder
    buoiKhamId?: SortOrder
    coSoId?: SortOrder
    hoTen?: SortOrder
    gioiTinh?: SortOrder
    ngaySinh?: SortOrder
    namSinh?: SortOrder
    cccd?: SortOrder
    diaChi?: SortOrder
    sdt?: SortOrder
    sdtNguoiNha?: SortOrder
    thiLucMP?: SortOrder
    thiLucMT?: SortOrder
    chanDoan?: SortOrder
    chanDoanKhac?: SortOrder
    khuyenNghi?: SortOrder
    bhyt?: SortOrder
    tuVanVienMa?: SortOrder
    soTienBao?: SortOrder
    ngayDieuTri?: SortOrder
    diemDon?: SortOrder
    gioDon?: SortOrder
    nhom?: SortOrder
    followUpStatus?: SortOrder
    nguoiPhuTrachMa?: SortOrder
    nguoiChotCuoiMa?: SortOrder
    ngayChot?: SortOrder
    daDon?: SortOrder
    ngayMoThucTe?: SortOrder
    soTienThucThu?: SortOrder
    trangThaiDieuTri?: SortOrder
    ngayTaiKham?: SortOrder
    ghiChuMat2?: SortOrder
    trangThai?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    createdBy?: SortOrder
    updatedBy?: SortOrder
    syncStatus?: SortOrder
  }

  export type HoSoBenhNhanMinOrderByAggregateInput = {
    id?: SortOrder
    maBN?: SortOrder
    maBNHIS?: SortOrder
    stt?: SortOrder
    buoiKhamId?: SortOrder
    coSoId?: SortOrder
    hoTen?: SortOrder
    gioiTinh?: SortOrder
    ngaySinh?: SortOrder
    namSinh?: SortOrder
    cccd?: SortOrder
    diaChi?: SortOrder
    sdt?: SortOrder
    sdtNguoiNha?: SortOrder
    thiLucMP?: SortOrder
    thiLucMT?: SortOrder
    chanDoan?: SortOrder
    chanDoanKhac?: SortOrder
    khuyenNghi?: SortOrder
    bhyt?: SortOrder
    tuVanVienMa?: SortOrder
    soTienBao?: SortOrder
    ngayDieuTri?: SortOrder
    diemDon?: SortOrder
    gioDon?: SortOrder
    nhom?: SortOrder
    followUpStatus?: SortOrder
    nguoiPhuTrachMa?: SortOrder
    nguoiChotCuoiMa?: SortOrder
    ngayChot?: SortOrder
    daDon?: SortOrder
    ngayMoThucTe?: SortOrder
    soTienThucThu?: SortOrder
    trangThaiDieuTri?: SortOrder
    ngayTaiKham?: SortOrder
    ghiChuMat2?: SortOrder
    trangThai?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    createdBy?: SortOrder
    updatedBy?: SortOrder
    syncStatus?: SortOrder
  }

  export type HoSoBenhNhanSumOrderByAggregateInput = {
    stt?: SortOrder
    namSinh?: SortOrder
    soTienBao?: SortOrder
    soTienThucThu?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type FloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type HoSoBenhNhanScalarRelationFilter = {
    is?: HoSoBenhNhanWhereInput
    isNot?: HoSoBenhNhanWhereInput
  }

  export type NhatKyTheoDoiCountOrderByAggregateInput = {
    id?: SortOrder
    hoSoId?: SortOrder
    ngay?: SortOrder
    nguoiGoiMa?: SortOrder
    noiDung?: SortOrder
    syncStatus?: SortOrder
  }

  export type NhatKyTheoDoiMaxOrderByAggregateInput = {
    id?: SortOrder
    hoSoId?: SortOrder
    ngay?: SortOrder
    nguoiGoiMa?: SortOrder
    noiDung?: SortOrder
    syncStatus?: SortOrder
  }

  export type NhatKyTheoDoiMinOrderByAggregateInput = {
    id?: SortOrder
    hoSoId?: SortOrder
    ngay?: SortOrder
    nguoiGoiMa?: SortOrder
    noiDung?: SortOrder
    syncStatus?: SortOrder
  }

  export type AuditLogCountOrderByAggregateInput = {
    id?: SortOrder
    bang?: SortOrder
    banGhiId?: SortOrder
    hanhDong?: SortOrder
    nguoiDung?: SortOrder
    thoiDiem?: SortOrder
    thayDoi?: SortOrder
  }

  export type AuditLogAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type AuditLogMaxOrderByAggregateInput = {
    id?: SortOrder
    bang?: SortOrder
    banGhiId?: SortOrder
    hanhDong?: SortOrder
    nguoiDung?: SortOrder
    thoiDiem?: SortOrder
    thayDoi?: SortOrder
  }

  export type AuditLogMinOrderByAggregateInput = {
    id?: SortOrder
    bang?: SortOrder
    banGhiId?: SortOrder
    hanhDong?: SortOrder
    nguoiDung?: SortOrder
    thoiDiem?: SortOrder
    thayDoi?: SortOrder
  }

  export type AuditLogSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type SyncQueueCountOrderByAggregateInput = {
    id?: SortOrder
    hoSoId?: SortOrder
    createdAt?: SortOrder
    retries?: SortOrder
  }

  export type SyncQueueAvgOrderByAggregateInput = {
    id?: SortOrder
    retries?: SortOrder
  }

  export type SyncQueueMaxOrderByAggregateInput = {
    id?: SortOrder
    hoSoId?: SortOrder
    createdAt?: SortOrder
    retries?: SortOrder
  }

  export type SyncQueueMinOrderByAggregateInput = {
    id?: SortOrder
    hoSoId?: SortOrder
    createdAt?: SortOrder
    retries?: SortOrder
  }

  export type SyncQueueSumOrderByAggregateInput = {
    id?: SortOrder
    retries?: SortOrder
  }

  export type DanhMucBenhVienCountOrderByAggregateInput = {
    id?: SortOrder
    ten?: SortOrder
    trangThai?: SortOrder
  }

  export type DanhMucBenhVienAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type DanhMucBenhVienMaxOrderByAggregateInput = {
    id?: SortOrder
    ten?: SortOrder
    trangThai?: SortOrder
  }

  export type DanhMucBenhVienMinOrderByAggregateInput = {
    id?: SortOrder
    ten?: SortOrder
    trangThai?: SortOrder
  }

  export type DanhMucBenhVienSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type BuoiKhamCreateNestedManyWithoutCoSoInput = {
    create?: XOR<BuoiKhamCreateWithoutCoSoInput, BuoiKhamUncheckedCreateWithoutCoSoInput> | BuoiKhamCreateWithoutCoSoInput[] | BuoiKhamUncheckedCreateWithoutCoSoInput[]
    connectOrCreate?: BuoiKhamCreateOrConnectWithoutCoSoInput | BuoiKhamCreateOrConnectWithoutCoSoInput[]
    createMany?: BuoiKhamCreateManyCoSoInputEnvelope
    connect?: BuoiKhamWhereUniqueInput | BuoiKhamWhereUniqueInput[]
  }

  export type NguoiDungCSRCreateNestedManyWithoutCoSoInput = {
    create?: XOR<NguoiDungCSRCreateWithoutCoSoInput, NguoiDungCSRUncheckedCreateWithoutCoSoInput> | NguoiDungCSRCreateWithoutCoSoInput[] | NguoiDungCSRUncheckedCreateWithoutCoSoInput[]
    connectOrCreate?: NguoiDungCSRCreateOrConnectWithoutCoSoInput | NguoiDungCSRCreateOrConnectWithoutCoSoInput[]
    createMany?: NguoiDungCSRCreateManyCoSoInputEnvelope
    connect?: NguoiDungCSRWhereUniqueInput | NguoiDungCSRWhereUniqueInput[]
  }

  export type HoSoBenhNhanCreateNestedManyWithoutCoSoInput = {
    create?: XOR<HoSoBenhNhanCreateWithoutCoSoInput, HoSoBenhNhanUncheckedCreateWithoutCoSoInput> | HoSoBenhNhanCreateWithoutCoSoInput[] | HoSoBenhNhanUncheckedCreateWithoutCoSoInput[]
    connectOrCreate?: HoSoBenhNhanCreateOrConnectWithoutCoSoInput | HoSoBenhNhanCreateOrConnectWithoutCoSoInput[]
    createMany?: HoSoBenhNhanCreateManyCoSoInputEnvelope
    connect?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
  }

  export type BuoiKhamUncheckedCreateNestedManyWithoutCoSoInput = {
    create?: XOR<BuoiKhamCreateWithoutCoSoInput, BuoiKhamUncheckedCreateWithoutCoSoInput> | BuoiKhamCreateWithoutCoSoInput[] | BuoiKhamUncheckedCreateWithoutCoSoInput[]
    connectOrCreate?: BuoiKhamCreateOrConnectWithoutCoSoInput | BuoiKhamCreateOrConnectWithoutCoSoInput[]
    createMany?: BuoiKhamCreateManyCoSoInputEnvelope
    connect?: BuoiKhamWhereUniqueInput | BuoiKhamWhereUniqueInput[]
  }

  export type NguoiDungCSRUncheckedCreateNestedManyWithoutCoSoInput = {
    create?: XOR<NguoiDungCSRCreateWithoutCoSoInput, NguoiDungCSRUncheckedCreateWithoutCoSoInput> | NguoiDungCSRCreateWithoutCoSoInput[] | NguoiDungCSRUncheckedCreateWithoutCoSoInput[]
    connectOrCreate?: NguoiDungCSRCreateOrConnectWithoutCoSoInput | NguoiDungCSRCreateOrConnectWithoutCoSoInput[]
    createMany?: NguoiDungCSRCreateManyCoSoInputEnvelope
    connect?: NguoiDungCSRWhereUniqueInput | NguoiDungCSRWhereUniqueInput[]
  }

  export type HoSoBenhNhanUncheckedCreateNestedManyWithoutCoSoInput = {
    create?: XOR<HoSoBenhNhanCreateWithoutCoSoInput, HoSoBenhNhanUncheckedCreateWithoutCoSoInput> | HoSoBenhNhanCreateWithoutCoSoInput[] | HoSoBenhNhanUncheckedCreateWithoutCoSoInput[]
    connectOrCreate?: HoSoBenhNhanCreateOrConnectWithoutCoSoInput | HoSoBenhNhanCreateOrConnectWithoutCoSoInput[]
    createMany?: HoSoBenhNhanCreateManyCoSoInputEnvelope
    connect?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type BuoiKhamUpdateManyWithoutCoSoNestedInput = {
    create?: XOR<BuoiKhamCreateWithoutCoSoInput, BuoiKhamUncheckedCreateWithoutCoSoInput> | BuoiKhamCreateWithoutCoSoInput[] | BuoiKhamUncheckedCreateWithoutCoSoInput[]
    connectOrCreate?: BuoiKhamCreateOrConnectWithoutCoSoInput | BuoiKhamCreateOrConnectWithoutCoSoInput[]
    upsert?: BuoiKhamUpsertWithWhereUniqueWithoutCoSoInput | BuoiKhamUpsertWithWhereUniqueWithoutCoSoInput[]
    createMany?: BuoiKhamCreateManyCoSoInputEnvelope
    set?: BuoiKhamWhereUniqueInput | BuoiKhamWhereUniqueInput[]
    disconnect?: BuoiKhamWhereUniqueInput | BuoiKhamWhereUniqueInput[]
    delete?: BuoiKhamWhereUniqueInput | BuoiKhamWhereUniqueInput[]
    connect?: BuoiKhamWhereUniqueInput | BuoiKhamWhereUniqueInput[]
    update?: BuoiKhamUpdateWithWhereUniqueWithoutCoSoInput | BuoiKhamUpdateWithWhereUniqueWithoutCoSoInput[]
    updateMany?: BuoiKhamUpdateManyWithWhereWithoutCoSoInput | BuoiKhamUpdateManyWithWhereWithoutCoSoInput[]
    deleteMany?: BuoiKhamScalarWhereInput | BuoiKhamScalarWhereInput[]
  }

  export type NguoiDungCSRUpdateManyWithoutCoSoNestedInput = {
    create?: XOR<NguoiDungCSRCreateWithoutCoSoInput, NguoiDungCSRUncheckedCreateWithoutCoSoInput> | NguoiDungCSRCreateWithoutCoSoInput[] | NguoiDungCSRUncheckedCreateWithoutCoSoInput[]
    connectOrCreate?: NguoiDungCSRCreateOrConnectWithoutCoSoInput | NguoiDungCSRCreateOrConnectWithoutCoSoInput[]
    upsert?: NguoiDungCSRUpsertWithWhereUniqueWithoutCoSoInput | NguoiDungCSRUpsertWithWhereUniqueWithoutCoSoInput[]
    createMany?: NguoiDungCSRCreateManyCoSoInputEnvelope
    set?: NguoiDungCSRWhereUniqueInput | NguoiDungCSRWhereUniqueInput[]
    disconnect?: NguoiDungCSRWhereUniqueInput | NguoiDungCSRWhereUniqueInput[]
    delete?: NguoiDungCSRWhereUniqueInput | NguoiDungCSRWhereUniqueInput[]
    connect?: NguoiDungCSRWhereUniqueInput | NguoiDungCSRWhereUniqueInput[]
    update?: NguoiDungCSRUpdateWithWhereUniqueWithoutCoSoInput | NguoiDungCSRUpdateWithWhereUniqueWithoutCoSoInput[]
    updateMany?: NguoiDungCSRUpdateManyWithWhereWithoutCoSoInput | NguoiDungCSRUpdateManyWithWhereWithoutCoSoInput[]
    deleteMany?: NguoiDungCSRScalarWhereInput | NguoiDungCSRScalarWhereInput[]
  }

  export type HoSoBenhNhanUpdateManyWithoutCoSoNestedInput = {
    create?: XOR<HoSoBenhNhanCreateWithoutCoSoInput, HoSoBenhNhanUncheckedCreateWithoutCoSoInput> | HoSoBenhNhanCreateWithoutCoSoInput[] | HoSoBenhNhanUncheckedCreateWithoutCoSoInput[]
    connectOrCreate?: HoSoBenhNhanCreateOrConnectWithoutCoSoInput | HoSoBenhNhanCreateOrConnectWithoutCoSoInput[]
    upsert?: HoSoBenhNhanUpsertWithWhereUniqueWithoutCoSoInput | HoSoBenhNhanUpsertWithWhereUniqueWithoutCoSoInput[]
    createMany?: HoSoBenhNhanCreateManyCoSoInputEnvelope
    set?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
    disconnect?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
    delete?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
    connect?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
    update?: HoSoBenhNhanUpdateWithWhereUniqueWithoutCoSoInput | HoSoBenhNhanUpdateWithWhereUniqueWithoutCoSoInput[]
    updateMany?: HoSoBenhNhanUpdateManyWithWhereWithoutCoSoInput | HoSoBenhNhanUpdateManyWithWhereWithoutCoSoInput[]
    deleteMany?: HoSoBenhNhanScalarWhereInput | HoSoBenhNhanScalarWhereInput[]
  }

  export type BuoiKhamUncheckedUpdateManyWithoutCoSoNestedInput = {
    create?: XOR<BuoiKhamCreateWithoutCoSoInput, BuoiKhamUncheckedCreateWithoutCoSoInput> | BuoiKhamCreateWithoutCoSoInput[] | BuoiKhamUncheckedCreateWithoutCoSoInput[]
    connectOrCreate?: BuoiKhamCreateOrConnectWithoutCoSoInput | BuoiKhamCreateOrConnectWithoutCoSoInput[]
    upsert?: BuoiKhamUpsertWithWhereUniqueWithoutCoSoInput | BuoiKhamUpsertWithWhereUniqueWithoutCoSoInput[]
    createMany?: BuoiKhamCreateManyCoSoInputEnvelope
    set?: BuoiKhamWhereUniqueInput | BuoiKhamWhereUniqueInput[]
    disconnect?: BuoiKhamWhereUniqueInput | BuoiKhamWhereUniqueInput[]
    delete?: BuoiKhamWhereUniqueInput | BuoiKhamWhereUniqueInput[]
    connect?: BuoiKhamWhereUniqueInput | BuoiKhamWhereUniqueInput[]
    update?: BuoiKhamUpdateWithWhereUniqueWithoutCoSoInput | BuoiKhamUpdateWithWhereUniqueWithoutCoSoInput[]
    updateMany?: BuoiKhamUpdateManyWithWhereWithoutCoSoInput | BuoiKhamUpdateManyWithWhereWithoutCoSoInput[]
    deleteMany?: BuoiKhamScalarWhereInput | BuoiKhamScalarWhereInput[]
  }

  export type NguoiDungCSRUncheckedUpdateManyWithoutCoSoNestedInput = {
    create?: XOR<NguoiDungCSRCreateWithoutCoSoInput, NguoiDungCSRUncheckedCreateWithoutCoSoInput> | NguoiDungCSRCreateWithoutCoSoInput[] | NguoiDungCSRUncheckedCreateWithoutCoSoInput[]
    connectOrCreate?: NguoiDungCSRCreateOrConnectWithoutCoSoInput | NguoiDungCSRCreateOrConnectWithoutCoSoInput[]
    upsert?: NguoiDungCSRUpsertWithWhereUniqueWithoutCoSoInput | NguoiDungCSRUpsertWithWhereUniqueWithoutCoSoInput[]
    createMany?: NguoiDungCSRCreateManyCoSoInputEnvelope
    set?: NguoiDungCSRWhereUniqueInput | NguoiDungCSRWhereUniqueInput[]
    disconnect?: NguoiDungCSRWhereUniqueInput | NguoiDungCSRWhereUniqueInput[]
    delete?: NguoiDungCSRWhereUniqueInput | NguoiDungCSRWhereUniqueInput[]
    connect?: NguoiDungCSRWhereUniqueInput | NguoiDungCSRWhereUniqueInput[]
    update?: NguoiDungCSRUpdateWithWhereUniqueWithoutCoSoInput | NguoiDungCSRUpdateWithWhereUniqueWithoutCoSoInput[]
    updateMany?: NguoiDungCSRUpdateManyWithWhereWithoutCoSoInput | NguoiDungCSRUpdateManyWithWhereWithoutCoSoInput[]
    deleteMany?: NguoiDungCSRScalarWhereInput | NguoiDungCSRScalarWhereInput[]
  }

  export type HoSoBenhNhanUncheckedUpdateManyWithoutCoSoNestedInput = {
    create?: XOR<HoSoBenhNhanCreateWithoutCoSoInput, HoSoBenhNhanUncheckedCreateWithoutCoSoInput> | HoSoBenhNhanCreateWithoutCoSoInput[] | HoSoBenhNhanUncheckedCreateWithoutCoSoInput[]
    connectOrCreate?: HoSoBenhNhanCreateOrConnectWithoutCoSoInput | HoSoBenhNhanCreateOrConnectWithoutCoSoInput[]
    upsert?: HoSoBenhNhanUpsertWithWhereUniqueWithoutCoSoInput | HoSoBenhNhanUpsertWithWhereUniqueWithoutCoSoInput[]
    createMany?: HoSoBenhNhanCreateManyCoSoInputEnvelope
    set?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
    disconnect?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
    delete?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
    connect?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
    update?: HoSoBenhNhanUpdateWithWhereUniqueWithoutCoSoInput | HoSoBenhNhanUpdateWithWhereUniqueWithoutCoSoInput[]
    updateMany?: HoSoBenhNhanUpdateManyWithWhereWithoutCoSoInput | HoSoBenhNhanUpdateManyWithWhereWithoutCoSoInput[]
    deleteMany?: HoSoBenhNhanScalarWhereInput | HoSoBenhNhanScalarWhereInput[]
  }

  export type CoSoCreateNestedOneWithoutNguoiDungInput = {
    create?: XOR<CoSoCreateWithoutNguoiDungInput, CoSoUncheckedCreateWithoutNguoiDungInput>
    connectOrCreate?: CoSoCreateOrConnectWithoutNguoiDungInput
    connect?: CoSoWhereUniqueInput
  }

  export type BuoiKhamCreateNestedManyWithoutNguoiTaoRefInput = {
    create?: XOR<BuoiKhamCreateWithoutNguoiTaoRefInput, BuoiKhamUncheckedCreateWithoutNguoiTaoRefInput> | BuoiKhamCreateWithoutNguoiTaoRefInput[] | BuoiKhamUncheckedCreateWithoutNguoiTaoRefInput[]
    connectOrCreate?: BuoiKhamCreateOrConnectWithoutNguoiTaoRefInput | BuoiKhamCreateOrConnectWithoutNguoiTaoRefInput[]
    createMany?: BuoiKhamCreateManyNguoiTaoRefInputEnvelope
    connect?: BuoiKhamWhereUniqueInput | BuoiKhamWhereUniqueInput[]
  }

  export type HoSoBenhNhanCreateNestedManyWithoutTuVanVienInput = {
    create?: XOR<HoSoBenhNhanCreateWithoutTuVanVienInput, HoSoBenhNhanUncheckedCreateWithoutTuVanVienInput> | HoSoBenhNhanCreateWithoutTuVanVienInput[] | HoSoBenhNhanUncheckedCreateWithoutTuVanVienInput[]
    connectOrCreate?: HoSoBenhNhanCreateOrConnectWithoutTuVanVienInput | HoSoBenhNhanCreateOrConnectWithoutTuVanVienInput[]
    createMany?: HoSoBenhNhanCreateManyTuVanVienInputEnvelope
    connect?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
  }

  export type HoSoBenhNhanCreateNestedManyWithoutNguoiPhuTrachInput = {
    create?: XOR<HoSoBenhNhanCreateWithoutNguoiPhuTrachInput, HoSoBenhNhanUncheckedCreateWithoutNguoiPhuTrachInput> | HoSoBenhNhanCreateWithoutNguoiPhuTrachInput[] | HoSoBenhNhanUncheckedCreateWithoutNguoiPhuTrachInput[]
    connectOrCreate?: HoSoBenhNhanCreateOrConnectWithoutNguoiPhuTrachInput | HoSoBenhNhanCreateOrConnectWithoutNguoiPhuTrachInput[]
    createMany?: HoSoBenhNhanCreateManyNguoiPhuTrachInputEnvelope
    connect?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
  }

  export type HoSoBenhNhanCreateNestedManyWithoutNguoiChotCuoiInput = {
    create?: XOR<HoSoBenhNhanCreateWithoutNguoiChotCuoiInput, HoSoBenhNhanUncheckedCreateWithoutNguoiChotCuoiInput> | HoSoBenhNhanCreateWithoutNguoiChotCuoiInput[] | HoSoBenhNhanUncheckedCreateWithoutNguoiChotCuoiInput[]
    connectOrCreate?: HoSoBenhNhanCreateOrConnectWithoutNguoiChotCuoiInput | HoSoBenhNhanCreateOrConnectWithoutNguoiChotCuoiInput[]
    createMany?: HoSoBenhNhanCreateManyNguoiChotCuoiInputEnvelope
    connect?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
  }

  export type NhatKyTheoDoiCreateNestedManyWithoutNguoiGoiInput = {
    create?: XOR<NhatKyTheoDoiCreateWithoutNguoiGoiInput, NhatKyTheoDoiUncheckedCreateWithoutNguoiGoiInput> | NhatKyTheoDoiCreateWithoutNguoiGoiInput[] | NhatKyTheoDoiUncheckedCreateWithoutNguoiGoiInput[]
    connectOrCreate?: NhatKyTheoDoiCreateOrConnectWithoutNguoiGoiInput | NhatKyTheoDoiCreateOrConnectWithoutNguoiGoiInput[]
    createMany?: NhatKyTheoDoiCreateManyNguoiGoiInputEnvelope
    connect?: NhatKyTheoDoiWhereUniqueInput | NhatKyTheoDoiWhereUniqueInput[]
  }

  export type BuoiKhamUncheckedCreateNestedManyWithoutNguoiTaoRefInput = {
    create?: XOR<BuoiKhamCreateWithoutNguoiTaoRefInput, BuoiKhamUncheckedCreateWithoutNguoiTaoRefInput> | BuoiKhamCreateWithoutNguoiTaoRefInput[] | BuoiKhamUncheckedCreateWithoutNguoiTaoRefInput[]
    connectOrCreate?: BuoiKhamCreateOrConnectWithoutNguoiTaoRefInput | BuoiKhamCreateOrConnectWithoutNguoiTaoRefInput[]
    createMany?: BuoiKhamCreateManyNguoiTaoRefInputEnvelope
    connect?: BuoiKhamWhereUniqueInput | BuoiKhamWhereUniqueInput[]
  }

  export type HoSoBenhNhanUncheckedCreateNestedManyWithoutTuVanVienInput = {
    create?: XOR<HoSoBenhNhanCreateWithoutTuVanVienInput, HoSoBenhNhanUncheckedCreateWithoutTuVanVienInput> | HoSoBenhNhanCreateWithoutTuVanVienInput[] | HoSoBenhNhanUncheckedCreateWithoutTuVanVienInput[]
    connectOrCreate?: HoSoBenhNhanCreateOrConnectWithoutTuVanVienInput | HoSoBenhNhanCreateOrConnectWithoutTuVanVienInput[]
    createMany?: HoSoBenhNhanCreateManyTuVanVienInputEnvelope
    connect?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
  }

  export type HoSoBenhNhanUncheckedCreateNestedManyWithoutNguoiPhuTrachInput = {
    create?: XOR<HoSoBenhNhanCreateWithoutNguoiPhuTrachInput, HoSoBenhNhanUncheckedCreateWithoutNguoiPhuTrachInput> | HoSoBenhNhanCreateWithoutNguoiPhuTrachInput[] | HoSoBenhNhanUncheckedCreateWithoutNguoiPhuTrachInput[]
    connectOrCreate?: HoSoBenhNhanCreateOrConnectWithoutNguoiPhuTrachInput | HoSoBenhNhanCreateOrConnectWithoutNguoiPhuTrachInput[]
    createMany?: HoSoBenhNhanCreateManyNguoiPhuTrachInputEnvelope
    connect?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
  }

  export type HoSoBenhNhanUncheckedCreateNestedManyWithoutNguoiChotCuoiInput = {
    create?: XOR<HoSoBenhNhanCreateWithoutNguoiChotCuoiInput, HoSoBenhNhanUncheckedCreateWithoutNguoiChotCuoiInput> | HoSoBenhNhanCreateWithoutNguoiChotCuoiInput[] | HoSoBenhNhanUncheckedCreateWithoutNguoiChotCuoiInput[]
    connectOrCreate?: HoSoBenhNhanCreateOrConnectWithoutNguoiChotCuoiInput | HoSoBenhNhanCreateOrConnectWithoutNguoiChotCuoiInput[]
    createMany?: HoSoBenhNhanCreateManyNguoiChotCuoiInputEnvelope
    connect?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
  }

  export type NhatKyTheoDoiUncheckedCreateNestedManyWithoutNguoiGoiInput = {
    create?: XOR<NhatKyTheoDoiCreateWithoutNguoiGoiInput, NhatKyTheoDoiUncheckedCreateWithoutNguoiGoiInput> | NhatKyTheoDoiCreateWithoutNguoiGoiInput[] | NhatKyTheoDoiUncheckedCreateWithoutNguoiGoiInput[]
    connectOrCreate?: NhatKyTheoDoiCreateOrConnectWithoutNguoiGoiInput | NhatKyTheoDoiCreateOrConnectWithoutNguoiGoiInput[]
    createMany?: NhatKyTheoDoiCreateManyNguoiGoiInputEnvelope
    connect?: NhatKyTheoDoiWhereUniqueInput | NhatKyTheoDoiWhereUniqueInput[]
  }

  export type CoSoUpdateOneWithoutNguoiDungNestedInput = {
    create?: XOR<CoSoCreateWithoutNguoiDungInput, CoSoUncheckedCreateWithoutNguoiDungInput>
    connectOrCreate?: CoSoCreateOrConnectWithoutNguoiDungInput
    upsert?: CoSoUpsertWithoutNguoiDungInput
    disconnect?: CoSoWhereInput | boolean
    delete?: CoSoWhereInput | boolean
    connect?: CoSoWhereUniqueInput
    update?: XOR<XOR<CoSoUpdateToOneWithWhereWithoutNguoiDungInput, CoSoUpdateWithoutNguoiDungInput>, CoSoUncheckedUpdateWithoutNguoiDungInput>
  }

  export type BuoiKhamUpdateManyWithoutNguoiTaoRefNestedInput = {
    create?: XOR<BuoiKhamCreateWithoutNguoiTaoRefInput, BuoiKhamUncheckedCreateWithoutNguoiTaoRefInput> | BuoiKhamCreateWithoutNguoiTaoRefInput[] | BuoiKhamUncheckedCreateWithoutNguoiTaoRefInput[]
    connectOrCreate?: BuoiKhamCreateOrConnectWithoutNguoiTaoRefInput | BuoiKhamCreateOrConnectWithoutNguoiTaoRefInput[]
    upsert?: BuoiKhamUpsertWithWhereUniqueWithoutNguoiTaoRefInput | BuoiKhamUpsertWithWhereUniqueWithoutNguoiTaoRefInput[]
    createMany?: BuoiKhamCreateManyNguoiTaoRefInputEnvelope
    set?: BuoiKhamWhereUniqueInput | BuoiKhamWhereUniqueInput[]
    disconnect?: BuoiKhamWhereUniqueInput | BuoiKhamWhereUniqueInput[]
    delete?: BuoiKhamWhereUniqueInput | BuoiKhamWhereUniqueInput[]
    connect?: BuoiKhamWhereUniqueInput | BuoiKhamWhereUniqueInput[]
    update?: BuoiKhamUpdateWithWhereUniqueWithoutNguoiTaoRefInput | BuoiKhamUpdateWithWhereUniqueWithoutNguoiTaoRefInput[]
    updateMany?: BuoiKhamUpdateManyWithWhereWithoutNguoiTaoRefInput | BuoiKhamUpdateManyWithWhereWithoutNguoiTaoRefInput[]
    deleteMany?: BuoiKhamScalarWhereInput | BuoiKhamScalarWhereInput[]
  }

  export type HoSoBenhNhanUpdateManyWithoutTuVanVienNestedInput = {
    create?: XOR<HoSoBenhNhanCreateWithoutTuVanVienInput, HoSoBenhNhanUncheckedCreateWithoutTuVanVienInput> | HoSoBenhNhanCreateWithoutTuVanVienInput[] | HoSoBenhNhanUncheckedCreateWithoutTuVanVienInput[]
    connectOrCreate?: HoSoBenhNhanCreateOrConnectWithoutTuVanVienInput | HoSoBenhNhanCreateOrConnectWithoutTuVanVienInput[]
    upsert?: HoSoBenhNhanUpsertWithWhereUniqueWithoutTuVanVienInput | HoSoBenhNhanUpsertWithWhereUniqueWithoutTuVanVienInput[]
    createMany?: HoSoBenhNhanCreateManyTuVanVienInputEnvelope
    set?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
    disconnect?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
    delete?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
    connect?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
    update?: HoSoBenhNhanUpdateWithWhereUniqueWithoutTuVanVienInput | HoSoBenhNhanUpdateWithWhereUniqueWithoutTuVanVienInput[]
    updateMany?: HoSoBenhNhanUpdateManyWithWhereWithoutTuVanVienInput | HoSoBenhNhanUpdateManyWithWhereWithoutTuVanVienInput[]
    deleteMany?: HoSoBenhNhanScalarWhereInput | HoSoBenhNhanScalarWhereInput[]
  }

  export type HoSoBenhNhanUpdateManyWithoutNguoiPhuTrachNestedInput = {
    create?: XOR<HoSoBenhNhanCreateWithoutNguoiPhuTrachInput, HoSoBenhNhanUncheckedCreateWithoutNguoiPhuTrachInput> | HoSoBenhNhanCreateWithoutNguoiPhuTrachInput[] | HoSoBenhNhanUncheckedCreateWithoutNguoiPhuTrachInput[]
    connectOrCreate?: HoSoBenhNhanCreateOrConnectWithoutNguoiPhuTrachInput | HoSoBenhNhanCreateOrConnectWithoutNguoiPhuTrachInput[]
    upsert?: HoSoBenhNhanUpsertWithWhereUniqueWithoutNguoiPhuTrachInput | HoSoBenhNhanUpsertWithWhereUniqueWithoutNguoiPhuTrachInput[]
    createMany?: HoSoBenhNhanCreateManyNguoiPhuTrachInputEnvelope
    set?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
    disconnect?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
    delete?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
    connect?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
    update?: HoSoBenhNhanUpdateWithWhereUniqueWithoutNguoiPhuTrachInput | HoSoBenhNhanUpdateWithWhereUniqueWithoutNguoiPhuTrachInput[]
    updateMany?: HoSoBenhNhanUpdateManyWithWhereWithoutNguoiPhuTrachInput | HoSoBenhNhanUpdateManyWithWhereWithoutNguoiPhuTrachInput[]
    deleteMany?: HoSoBenhNhanScalarWhereInput | HoSoBenhNhanScalarWhereInput[]
  }

  export type HoSoBenhNhanUpdateManyWithoutNguoiChotCuoiNestedInput = {
    create?: XOR<HoSoBenhNhanCreateWithoutNguoiChotCuoiInput, HoSoBenhNhanUncheckedCreateWithoutNguoiChotCuoiInput> | HoSoBenhNhanCreateWithoutNguoiChotCuoiInput[] | HoSoBenhNhanUncheckedCreateWithoutNguoiChotCuoiInput[]
    connectOrCreate?: HoSoBenhNhanCreateOrConnectWithoutNguoiChotCuoiInput | HoSoBenhNhanCreateOrConnectWithoutNguoiChotCuoiInput[]
    upsert?: HoSoBenhNhanUpsertWithWhereUniqueWithoutNguoiChotCuoiInput | HoSoBenhNhanUpsertWithWhereUniqueWithoutNguoiChotCuoiInput[]
    createMany?: HoSoBenhNhanCreateManyNguoiChotCuoiInputEnvelope
    set?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
    disconnect?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
    delete?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
    connect?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
    update?: HoSoBenhNhanUpdateWithWhereUniqueWithoutNguoiChotCuoiInput | HoSoBenhNhanUpdateWithWhereUniqueWithoutNguoiChotCuoiInput[]
    updateMany?: HoSoBenhNhanUpdateManyWithWhereWithoutNguoiChotCuoiInput | HoSoBenhNhanUpdateManyWithWhereWithoutNguoiChotCuoiInput[]
    deleteMany?: HoSoBenhNhanScalarWhereInput | HoSoBenhNhanScalarWhereInput[]
  }

  export type NhatKyTheoDoiUpdateManyWithoutNguoiGoiNestedInput = {
    create?: XOR<NhatKyTheoDoiCreateWithoutNguoiGoiInput, NhatKyTheoDoiUncheckedCreateWithoutNguoiGoiInput> | NhatKyTheoDoiCreateWithoutNguoiGoiInput[] | NhatKyTheoDoiUncheckedCreateWithoutNguoiGoiInput[]
    connectOrCreate?: NhatKyTheoDoiCreateOrConnectWithoutNguoiGoiInput | NhatKyTheoDoiCreateOrConnectWithoutNguoiGoiInput[]
    upsert?: NhatKyTheoDoiUpsertWithWhereUniqueWithoutNguoiGoiInput | NhatKyTheoDoiUpsertWithWhereUniqueWithoutNguoiGoiInput[]
    createMany?: NhatKyTheoDoiCreateManyNguoiGoiInputEnvelope
    set?: NhatKyTheoDoiWhereUniqueInput | NhatKyTheoDoiWhereUniqueInput[]
    disconnect?: NhatKyTheoDoiWhereUniqueInput | NhatKyTheoDoiWhereUniqueInput[]
    delete?: NhatKyTheoDoiWhereUniqueInput | NhatKyTheoDoiWhereUniqueInput[]
    connect?: NhatKyTheoDoiWhereUniqueInput | NhatKyTheoDoiWhereUniqueInput[]
    update?: NhatKyTheoDoiUpdateWithWhereUniqueWithoutNguoiGoiInput | NhatKyTheoDoiUpdateWithWhereUniqueWithoutNguoiGoiInput[]
    updateMany?: NhatKyTheoDoiUpdateManyWithWhereWithoutNguoiGoiInput | NhatKyTheoDoiUpdateManyWithWhereWithoutNguoiGoiInput[]
    deleteMany?: NhatKyTheoDoiScalarWhereInput | NhatKyTheoDoiScalarWhereInput[]
  }

  export type BuoiKhamUncheckedUpdateManyWithoutNguoiTaoRefNestedInput = {
    create?: XOR<BuoiKhamCreateWithoutNguoiTaoRefInput, BuoiKhamUncheckedCreateWithoutNguoiTaoRefInput> | BuoiKhamCreateWithoutNguoiTaoRefInput[] | BuoiKhamUncheckedCreateWithoutNguoiTaoRefInput[]
    connectOrCreate?: BuoiKhamCreateOrConnectWithoutNguoiTaoRefInput | BuoiKhamCreateOrConnectWithoutNguoiTaoRefInput[]
    upsert?: BuoiKhamUpsertWithWhereUniqueWithoutNguoiTaoRefInput | BuoiKhamUpsertWithWhereUniqueWithoutNguoiTaoRefInput[]
    createMany?: BuoiKhamCreateManyNguoiTaoRefInputEnvelope
    set?: BuoiKhamWhereUniqueInput | BuoiKhamWhereUniqueInput[]
    disconnect?: BuoiKhamWhereUniqueInput | BuoiKhamWhereUniqueInput[]
    delete?: BuoiKhamWhereUniqueInput | BuoiKhamWhereUniqueInput[]
    connect?: BuoiKhamWhereUniqueInput | BuoiKhamWhereUniqueInput[]
    update?: BuoiKhamUpdateWithWhereUniqueWithoutNguoiTaoRefInput | BuoiKhamUpdateWithWhereUniqueWithoutNguoiTaoRefInput[]
    updateMany?: BuoiKhamUpdateManyWithWhereWithoutNguoiTaoRefInput | BuoiKhamUpdateManyWithWhereWithoutNguoiTaoRefInput[]
    deleteMany?: BuoiKhamScalarWhereInput | BuoiKhamScalarWhereInput[]
  }

  export type HoSoBenhNhanUncheckedUpdateManyWithoutTuVanVienNestedInput = {
    create?: XOR<HoSoBenhNhanCreateWithoutTuVanVienInput, HoSoBenhNhanUncheckedCreateWithoutTuVanVienInput> | HoSoBenhNhanCreateWithoutTuVanVienInput[] | HoSoBenhNhanUncheckedCreateWithoutTuVanVienInput[]
    connectOrCreate?: HoSoBenhNhanCreateOrConnectWithoutTuVanVienInput | HoSoBenhNhanCreateOrConnectWithoutTuVanVienInput[]
    upsert?: HoSoBenhNhanUpsertWithWhereUniqueWithoutTuVanVienInput | HoSoBenhNhanUpsertWithWhereUniqueWithoutTuVanVienInput[]
    createMany?: HoSoBenhNhanCreateManyTuVanVienInputEnvelope
    set?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
    disconnect?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
    delete?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
    connect?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
    update?: HoSoBenhNhanUpdateWithWhereUniqueWithoutTuVanVienInput | HoSoBenhNhanUpdateWithWhereUniqueWithoutTuVanVienInput[]
    updateMany?: HoSoBenhNhanUpdateManyWithWhereWithoutTuVanVienInput | HoSoBenhNhanUpdateManyWithWhereWithoutTuVanVienInput[]
    deleteMany?: HoSoBenhNhanScalarWhereInput | HoSoBenhNhanScalarWhereInput[]
  }

  export type HoSoBenhNhanUncheckedUpdateManyWithoutNguoiPhuTrachNestedInput = {
    create?: XOR<HoSoBenhNhanCreateWithoutNguoiPhuTrachInput, HoSoBenhNhanUncheckedCreateWithoutNguoiPhuTrachInput> | HoSoBenhNhanCreateWithoutNguoiPhuTrachInput[] | HoSoBenhNhanUncheckedCreateWithoutNguoiPhuTrachInput[]
    connectOrCreate?: HoSoBenhNhanCreateOrConnectWithoutNguoiPhuTrachInput | HoSoBenhNhanCreateOrConnectWithoutNguoiPhuTrachInput[]
    upsert?: HoSoBenhNhanUpsertWithWhereUniqueWithoutNguoiPhuTrachInput | HoSoBenhNhanUpsertWithWhereUniqueWithoutNguoiPhuTrachInput[]
    createMany?: HoSoBenhNhanCreateManyNguoiPhuTrachInputEnvelope
    set?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
    disconnect?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
    delete?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
    connect?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
    update?: HoSoBenhNhanUpdateWithWhereUniqueWithoutNguoiPhuTrachInput | HoSoBenhNhanUpdateWithWhereUniqueWithoutNguoiPhuTrachInput[]
    updateMany?: HoSoBenhNhanUpdateManyWithWhereWithoutNguoiPhuTrachInput | HoSoBenhNhanUpdateManyWithWhereWithoutNguoiPhuTrachInput[]
    deleteMany?: HoSoBenhNhanScalarWhereInput | HoSoBenhNhanScalarWhereInput[]
  }

  export type HoSoBenhNhanUncheckedUpdateManyWithoutNguoiChotCuoiNestedInput = {
    create?: XOR<HoSoBenhNhanCreateWithoutNguoiChotCuoiInput, HoSoBenhNhanUncheckedCreateWithoutNguoiChotCuoiInput> | HoSoBenhNhanCreateWithoutNguoiChotCuoiInput[] | HoSoBenhNhanUncheckedCreateWithoutNguoiChotCuoiInput[]
    connectOrCreate?: HoSoBenhNhanCreateOrConnectWithoutNguoiChotCuoiInput | HoSoBenhNhanCreateOrConnectWithoutNguoiChotCuoiInput[]
    upsert?: HoSoBenhNhanUpsertWithWhereUniqueWithoutNguoiChotCuoiInput | HoSoBenhNhanUpsertWithWhereUniqueWithoutNguoiChotCuoiInput[]
    createMany?: HoSoBenhNhanCreateManyNguoiChotCuoiInputEnvelope
    set?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
    disconnect?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
    delete?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
    connect?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
    update?: HoSoBenhNhanUpdateWithWhereUniqueWithoutNguoiChotCuoiInput | HoSoBenhNhanUpdateWithWhereUniqueWithoutNguoiChotCuoiInput[]
    updateMany?: HoSoBenhNhanUpdateManyWithWhereWithoutNguoiChotCuoiInput | HoSoBenhNhanUpdateManyWithWhereWithoutNguoiChotCuoiInput[]
    deleteMany?: HoSoBenhNhanScalarWhereInput | HoSoBenhNhanScalarWhereInput[]
  }

  export type NhatKyTheoDoiUncheckedUpdateManyWithoutNguoiGoiNestedInput = {
    create?: XOR<NhatKyTheoDoiCreateWithoutNguoiGoiInput, NhatKyTheoDoiUncheckedCreateWithoutNguoiGoiInput> | NhatKyTheoDoiCreateWithoutNguoiGoiInput[] | NhatKyTheoDoiUncheckedCreateWithoutNguoiGoiInput[]
    connectOrCreate?: NhatKyTheoDoiCreateOrConnectWithoutNguoiGoiInput | NhatKyTheoDoiCreateOrConnectWithoutNguoiGoiInput[]
    upsert?: NhatKyTheoDoiUpsertWithWhereUniqueWithoutNguoiGoiInput | NhatKyTheoDoiUpsertWithWhereUniqueWithoutNguoiGoiInput[]
    createMany?: NhatKyTheoDoiCreateManyNguoiGoiInputEnvelope
    set?: NhatKyTheoDoiWhereUniqueInput | NhatKyTheoDoiWhereUniqueInput[]
    disconnect?: NhatKyTheoDoiWhereUniqueInput | NhatKyTheoDoiWhereUniqueInput[]
    delete?: NhatKyTheoDoiWhereUniqueInput | NhatKyTheoDoiWhereUniqueInput[]
    connect?: NhatKyTheoDoiWhereUniqueInput | NhatKyTheoDoiWhereUniqueInput[]
    update?: NhatKyTheoDoiUpdateWithWhereUniqueWithoutNguoiGoiInput | NhatKyTheoDoiUpdateWithWhereUniqueWithoutNguoiGoiInput[]
    updateMany?: NhatKyTheoDoiUpdateManyWithWhereWithoutNguoiGoiInput | NhatKyTheoDoiUpdateManyWithWhereWithoutNguoiGoiInput[]
    deleteMany?: NhatKyTheoDoiScalarWhereInput | NhatKyTheoDoiScalarWhereInput[]
  }

  export type CoSoCreateNestedOneWithoutBuoiKhamInput = {
    create?: XOR<CoSoCreateWithoutBuoiKhamInput, CoSoUncheckedCreateWithoutBuoiKhamInput>
    connectOrCreate?: CoSoCreateOrConnectWithoutBuoiKhamInput
    connect?: CoSoWhereUniqueInput
  }

  export type NguoiDungCSRCreateNestedOneWithoutBuoiKhamTaoInput = {
    create?: XOR<NguoiDungCSRCreateWithoutBuoiKhamTaoInput, NguoiDungCSRUncheckedCreateWithoutBuoiKhamTaoInput>
    connectOrCreate?: NguoiDungCSRCreateOrConnectWithoutBuoiKhamTaoInput
    connect?: NguoiDungCSRWhereUniqueInput
  }

  export type HoSoBenhNhanCreateNestedManyWithoutBuoiKhamInput = {
    create?: XOR<HoSoBenhNhanCreateWithoutBuoiKhamInput, HoSoBenhNhanUncheckedCreateWithoutBuoiKhamInput> | HoSoBenhNhanCreateWithoutBuoiKhamInput[] | HoSoBenhNhanUncheckedCreateWithoutBuoiKhamInput[]
    connectOrCreate?: HoSoBenhNhanCreateOrConnectWithoutBuoiKhamInput | HoSoBenhNhanCreateOrConnectWithoutBuoiKhamInput[]
    createMany?: HoSoBenhNhanCreateManyBuoiKhamInputEnvelope
    connect?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
  }

  export type HoSoBenhNhanUncheckedCreateNestedManyWithoutBuoiKhamInput = {
    create?: XOR<HoSoBenhNhanCreateWithoutBuoiKhamInput, HoSoBenhNhanUncheckedCreateWithoutBuoiKhamInput> | HoSoBenhNhanCreateWithoutBuoiKhamInput[] | HoSoBenhNhanUncheckedCreateWithoutBuoiKhamInput[]
    connectOrCreate?: HoSoBenhNhanCreateOrConnectWithoutBuoiKhamInput | HoSoBenhNhanCreateOrConnectWithoutBuoiKhamInput[]
    createMany?: HoSoBenhNhanCreateManyBuoiKhamInputEnvelope
    connect?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type CoSoUpdateOneRequiredWithoutBuoiKhamNestedInput = {
    create?: XOR<CoSoCreateWithoutBuoiKhamInput, CoSoUncheckedCreateWithoutBuoiKhamInput>
    connectOrCreate?: CoSoCreateOrConnectWithoutBuoiKhamInput
    upsert?: CoSoUpsertWithoutBuoiKhamInput
    connect?: CoSoWhereUniqueInput
    update?: XOR<XOR<CoSoUpdateToOneWithWhereWithoutBuoiKhamInput, CoSoUpdateWithoutBuoiKhamInput>, CoSoUncheckedUpdateWithoutBuoiKhamInput>
  }

  export type NguoiDungCSRUpdateOneRequiredWithoutBuoiKhamTaoNestedInput = {
    create?: XOR<NguoiDungCSRCreateWithoutBuoiKhamTaoInput, NguoiDungCSRUncheckedCreateWithoutBuoiKhamTaoInput>
    connectOrCreate?: NguoiDungCSRCreateOrConnectWithoutBuoiKhamTaoInput
    upsert?: NguoiDungCSRUpsertWithoutBuoiKhamTaoInput
    connect?: NguoiDungCSRWhereUniqueInput
    update?: XOR<XOR<NguoiDungCSRUpdateToOneWithWhereWithoutBuoiKhamTaoInput, NguoiDungCSRUpdateWithoutBuoiKhamTaoInput>, NguoiDungCSRUncheckedUpdateWithoutBuoiKhamTaoInput>
  }

  export type HoSoBenhNhanUpdateManyWithoutBuoiKhamNestedInput = {
    create?: XOR<HoSoBenhNhanCreateWithoutBuoiKhamInput, HoSoBenhNhanUncheckedCreateWithoutBuoiKhamInput> | HoSoBenhNhanCreateWithoutBuoiKhamInput[] | HoSoBenhNhanUncheckedCreateWithoutBuoiKhamInput[]
    connectOrCreate?: HoSoBenhNhanCreateOrConnectWithoutBuoiKhamInput | HoSoBenhNhanCreateOrConnectWithoutBuoiKhamInput[]
    upsert?: HoSoBenhNhanUpsertWithWhereUniqueWithoutBuoiKhamInput | HoSoBenhNhanUpsertWithWhereUniqueWithoutBuoiKhamInput[]
    createMany?: HoSoBenhNhanCreateManyBuoiKhamInputEnvelope
    set?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
    disconnect?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
    delete?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
    connect?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
    update?: HoSoBenhNhanUpdateWithWhereUniqueWithoutBuoiKhamInput | HoSoBenhNhanUpdateWithWhereUniqueWithoutBuoiKhamInput[]
    updateMany?: HoSoBenhNhanUpdateManyWithWhereWithoutBuoiKhamInput | HoSoBenhNhanUpdateManyWithWhereWithoutBuoiKhamInput[]
    deleteMany?: HoSoBenhNhanScalarWhereInput | HoSoBenhNhanScalarWhereInput[]
  }

  export type HoSoBenhNhanUncheckedUpdateManyWithoutBuoiKhamNestedInput = {
    create?: XOR<HoSoBenhNhanCreateWithoutBuoiKhamInput, HoSoBenhNhanUncheckedCreateWithoutBuoiKhamInput> | HoSoBenhNhanCreateWithoutBuoiKhamInput[] | HoSoBenhNhanUncheckedCreateWithoutBuoiKhamInput[]
    connectOrCreate?: HoSoBenhNhanCreateOrConnectWithoutBuoiKhamInput | HoSoBenhNhanCreateOrConnectWithoutBuoiKhamInput[]
    upsert?: HoSoBenhNhanUpsertWithWhereUniqueWithoutBuoiKhamInput | HoSoBenhNhanUpsertWithWhereUniqueWithoutBuoiKhamInput[]
    createMany?: HoSoBenhNhanCreateManyBuoiKhamInputEnvelope
    set?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
    disconnect?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
    delete?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
    connect?: HoSoBenhNhanWhereUniqueInput | HoSoBenhNhanWhereUniqueInput[]
    update?: HoSoBenhNhanUpdateWithWhereUniqueWithoutBuoiKhamInput | HoSoBenhNhanUpdateWithWhereUniqueWithoutBuoiKhamInput[]
    updateMany?: HoSoBenhNhanUpdateManyWithWhereWithoutBuoiKhamInput | HoSoBenhNhanUpdateManyWithWhereWithoutBuoiKhamInput[]
    deleteMany?: HoSoBenhNhanScalarWhereInput | HoSoBenhNhanScalarWhereInput[]
  }

  export type BuoiKhamCreateNestedOneWithoutHoSoInput = {
    create?: XOR<BuoiKhamCreateWithoutHoSoInput, BuoiKhamUncheckedCreateWithoutHoSoInput>
    connectOrCreate?: BuoiKhamCreateOrConnectWithoutHoSoInput
    connect?: BuoiKhamWhereUniqueInput
  }

  export type CoSoCreateNestedOneWithoutHoSoInput = {
    create?: XOR<CoSoCreateWithoutHoSoInput, CoSoUncheckedCreateWithoutHoSoInput>
    connectOrCreate?: CoSoCreateOrConnectWithoutHoSoInput
    connect?: CoSoWhereUniqueInput
  }

  export type NguoiDungCSRCreateNestedOneWithoutHoSoTuVanInput = {
    create?: XOR<NguoiDungCSRCreateWithoutHoSoTuVanInput, NguoiDungCSRUncheckedCreateWithoutHoSoTuVanInput>
    connectOrCreate?: NguoiDungCSRCreateOrConnectWithoutHoSoTuVanInput
    connect?: NguoiDungCSRWhereUniqueInput
  }

  export type NguoiDungCSRCreateNestedOneWithoutHoSoPhuTrachInput = {
    create?: XOR<NguoiDungCSRCreateWithoutHoSoPhuTrachInput, NguoiDungCSRUncheckedCreateWithoutHoSoPhuTrachInput>
    connectOrCreate?: NguoiDungCSRCreateOrConnectWithoutHoSoPhuTrachInput
    connect?: NguoiDungCSRWhereUniqueInput
  }

  export type NguoiDungCSRCreateNestedOneWithoutHoSoChotCuoiInput = {
    create?: XOR<NguoiDungCSRCreateWithoutHoSoChotCuoiInput, NguoiDungCSRUncheckedCreateWithoutHoSoChotCuoiInput>
    connectOrCreate?: NguoiDungCSRCreateOrConnectWithoutHoSoChotCuoiInput
    connect?: NguoiDungCSRWhereUniqueInput
  }

  export type NhatKyTheoDoiCreateNestedManyWithoutHoSoInput = {
    create?: XOR<NhatKyTheoDoiCreateWithoutHoSoInput, NhatKyTheoDoiUncheckedCreateWithoutHoSoInput> | NhatKyTheoDoiCreateWithoutHoSoInput[] | NhatKyTheoDoiUncheckedCreateWithoutHoSoInput[]
    connectOrCreate?: NhatKyTheoDoiCreateOrConnectWithoutHoSoInput | NhatKyTheoDoiCreateOrConnectWithoutHoSoInput[]
    createMany?: NhatKyTheoDoiCreateManyHoSoInputEnvelope
    connect?: NhatKyTheoDoiWhereUniqueInput | NhatKyTheoDoiWhereUniqueInput[]
  }

  export type NhatKyTheoDoiUncheckedCreateNestedManyWithoutHoSoInput = {
    create?: XOR<NhatKyTheoDoiCreateWithoutHoSoInput, NhatKyTheoDoiUncheckedCreateWithoutHoSoInput> | NhatKyTheoDoiCreateWithoutHoSoInput[] | NhatKyTheoDoiUncheckedCreateWithoutHoSoInput[]
    connectOrCreate?: NhatKyTheoDoiCreateOrConnectWithoutHoSoInput | NhatKyTheoDoiCreateOrConnectWithoutHoSoInput[]
    createMany?: NhatKyTheoDoiCreateManyHoSoInputEnvelope
    connect?: NhatKyTheoDoiWhereUniqueInput | NhatKyTheoDoiWhereUniqueInput[]
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type NullableFloatFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type BuoiKhamUpdateOneRequiredWithoutHoSoNestedInput = {
    create?: XOR<BuoiKhamCreateWithoutHoSoInput, BuoiKhamUncheckedCreateWithoutHoSoInput>
    connectOrCreate?: BuoiKhamCreateOrConnectWithoutHoSoInput
    upsert?: BuoiKhamUpsertWithoutHoSoInput
    connect?: BuoiKhamWhereUniqueInput
    update?: XOR<XOR<BuoiKhamUpdateToOneWithWhereWithoutHoSoInput, BuoiKhamUpdateWithoutHoSoInput>, BuoiKhamUncheckedUpdateWithoutHoSoInput>
  }

  export type CoSoUpdateOneRequiredWithoutHoSoNestedInput = {
    create?: XOR<CoSoCreateWithoutHoSoInput, CoSoUncheckedCreateWithoutHoSoInput>
    connectOrCreate?: CoSoCreateOrConnectWithoutHoSoInput
    upsert?: CoSoUpsertWithoutHoSoInput
    connect?: CoSoWhereUniqueInput
    update?: XOR<XOR<CoSoUpdateToOneWithWhereWithoutHoSoInput, CoSoUpdateWithoutHoSoInput>, CoSoUncheckedUpdateWithoutHoSoInput>
  }

  export type NguoiDungCSRUpdateOneWithoutHoSoTuVanNestedInput = {
    create?: XOR<NguoiDungCSRCreateWithoutHoSoTuVanInput, NguoiDungCSRUncheckedCreateWithoutHoSoTuVanInput>
    connectOrCreate?: NguoiDungCSRCreateOrConnectWithoutHoSoTuVanInput
    upsert?: NguoiDungCSRUpsertWithoutHoSoTuVanInput
    disconnect?: NguoiDungCSRWhereInput | boolean
    delete?: NguoiDungCSRWhereInput | boolean
    connect?: NguoiDungCSRWhereUniqueInput
    update?: XOR<XOR<NguoiDungCSRUpdateToOneWithWhereWithoutHoSoTuVanInput, NguoiDungCSRUpdateWithoutHoSoTuVanInput>, NguoiDungCSRUncheckedUpdateWithoutHoSoTuVanInput>
  }

  export type NguoiDungCSRUpdateOneWithoutHoSoPhuTrachNestedInput = {
    create?: XOR<NguoiDungCSRCreateWithoutHoSoPhuTrachInput, NguoiDungCSRUncheckedCreateWithoutHoSoPhuTrachInput>
    connectOrCreate?: NguoiDungCSRCreateOrConnectWithoutHoSoPhuTrachInput
    upsert?: NguoiDungCSRUpsertWithoutHoSoPhuTrachInput
    disconnect?: NguoiDungCSRWhereInput | boolean
    delete?: NguoiDungCSRWhereInput | boolean
    connect?: NguoiDungCSRWhereUniqueInput
    update?: XOR<XOR<NguoiDungCSRUpdateToOneWithWhereWithoutHoSoPhuTrachInput, NguoiDungCSRUpdateWithoutHoSoPhuTrachInput>, NguoiDungCSRUncheckedUpdateWithoutHoSoPhuTrachInput>
  }

  export type NguoiDungCSRUpdateOneWithoutHoSoChotCuoiNestedInput = {
    create?: XOR<NguoiDungCSRCreateWithoutHoSoChotCuoiInput, NguoiDungCSRUncheckedCreateWithoutHoSoChotCuoiInput>
    connectOrCreate?: NguoiDungCSRCreateOrConnectWithoutHoSoChotCuoiInput
    upsert?: NguoiDungCSRUpsertWithoutHoSoChotCuoiInput
    disconnect?: NguoiDungCSRWhereInput | boolean
    delete?: NguoiDungCSRWhereInput | boolean
    connect?: NguoiDungCSRWhereUniqueInput
    update?: XOR<XOR<NguoiDungCSRUpdateToOneWithWhereWithoutHoSoChotCuoiInput, NguoiDungCSRUpdateWithoutHoSoChotCuoiInput>, NguoiDungCSRUncheckedUpdateWithoutHoSoChotCuoiInput>
  }

  export type NhatKyTheoDoiUpdateManyWithoutHoSoNestedInput = {
    create?: XOR<NhatKyTheoDoiCreateWithoutHoSoInput, NhatKyTheoDoiUncheckedCreateWithoutHoSoInput> | NhatKyTheoDoiCreateWithoutHoSoInput[] | NhatKyTheoDoiUncheckedCreateWithoutHoSoInput[]
    connectOrCreate?: NhatKyTheoDoiCreateOrConnectWithoutHoSoInput | NhatKyTheoDoiCreateOrConnectWithoutHoSoInput[]
    upsert?: NhatKyTheoDoiUpsertWithWhereUniqueWithoutHoSoInput | NhatKyTheoDoiUpsertWithWhereUniqueWithoutHoSoInput[]
    createMany?: NhatKyTheoDoiCreateManyHoSoInputEnvelope
    set?: NhatKyTheoDoiWhereUniqueInput | NhatKyTheoDoiWhereUniqueInput[]
    disconnect?: NhatKyTheoDoiWhereUniqueInput | NhatKyTheoDoiWhereUniqueInput[]
    delete?: NhatKyTheoDoiWhereUniqueInput | NhatKyTheoDoiWhereUniqueInput[]
    connect?: NhatKyTheoDoiWhereUniqueInput | NhatKyTheoDoiWhereUniqueInput[]
    update?: NhatKyTheoDoiUpdateWithWhereUniqueWithoutHoSoInput | NhatKyTheoDoiUpdateWithWhereUniqueWithoutHoSoInput[]
    updateMany?: NhatKyTheoDoiUpdateManyWithWhereWithoutHoSoInput | NhatKyTheoDoiUpdateManyWithWhereWithoutHoSoInput[]
    deleteMany?: NhatKyTheoDoiScalarWhereInput | NhatKyTheoDoiScalarWhereInput[]
  }

  export type NhatKyTheoDoiUncheckedUpdateManyWithoutHoSoNestedInput = {
    create?: XOR<NhatKyTheoDoiCreateWithoutHoSoInput, NhatKyTheoDoiUncheckedCreateWithoutHoSoInput> | NhatKyTheoDoiCreateWithoutHoSoInput[] | NhatKyTheoDoiUncheckedCreateWithoutHoSoInput[]
    connectOrCreate?: NhatKyTheoDoiCreateOrConnectWithoutHoSoInput | NhatKyTheoDoiCreateOrConnectWithoutHoSoInput[]
    upsert?: NhatKyTheoDoiUpsertWithWhereUniqueWithoutHoSoInput | NhatKyTheoDoiUpsertWithWhereUniqueWithoutHoSoInput[]
    createMany?: NhatKyTheoDoiCreateManyHoSoInputEnvelope
    set?: NhatKyTheoDoiWhereUniqueInput | NhatKyTheoDoiWhereUniqueInput[]
    disconnect?: NhatKyTheoDoiWhereUniqueInput | NhatKyTheoDoiWhereUniqueInput[]
    delete?: NhatKyTheoDoiWhereUniqueInput | NhatKyTheoDoiWhereUniqueInput[]
    connect?: NhatKyTheoDoiWhereUniqueInput | NhatKyTheoDoiWhereUniqueInput[]
    update?: NhatKyTheoDoiUpdateWithWhereUniqueWithoutHoSoInput | NhatKyTheoDoiUpdateWithWhereUniqueWithoutHoSoInput[]
    updateMany?: NhatKyTheoDoiUpdateManyWithWhereWithoutHoSoInput | NhatKyTheoDoiUpdateManyWithWhereWithoutHoSoInput[]
    deleteMany?: NhatKyTheoDoiScalarWhereInput | NhatKyTheoDoiScalarWhereInput[]
  }

  export type HoSoBenhNhanCreateNestedOneWithoutNhatKyInput = {
    create?: XOR<HoSoBenhNhanCreateWithoutNhatKyInput, HoSoBenhNhanUncheckedCreateWithoutNhatKyInput>
    connectOrCreate?: HoSoBenhNhanCreateOrConnectWithoutNhatKyInput
    connect?: HoSoBenhNhanWhereUniqueInput
  }

  export type NguoiDungCSRCreateNestedOneWithoutNhatKyInput = {
    create?: XOR<NguoiDungCSRCreateWithoutNhatKyInput, NguoiDungCSRUncheckedCreateWithoutNhatKyInput>
    connectOrCreate?: NguoiDungCSRCreateOrConnectWithoutNhatKyInput
    connect?: NguoiDungCSRWhereUniqueInput
  }

  export type HoSoBenhNhanUpdateOneRequiredWithoutNhatKyNestedInput = {
    create?: XOR<HoSoBenhNhanCreateWithoutNhatKyInput, HoSoBenhNhanUncheckedCreateWithoutNhatKyInput>
    connectOrCreate?: HoSoBenhNhanCreateOrConnectWithoutNhatKyInput
    upsert?: HoSoBenhNhanUpsertWithoutNhatKyInput
    connect?: HoSoBenhNhanWhereUniqueInput
    update?: XOR<XOR<HoSoBenhNhanUpdateToOneWithWhereWithoutNhatKyInput, HoSoBenhNhanUpdateWithoutNhatKyInput>, HoSoBenhNhanUncheckedUpdateWithoutNhatKyInput>
  }

  export type NguoiDungCSRUpdateOneRequiredWithoutNhatKyNestedInput = {
    create?: XOR<NguoiDungCSRCreateWithoutNhatKyInput, NguoiDungCSRUncheckedCreateWithoutNhatKyInput>
    connectOrCreate?: NguoiDungCSRCreateOrConnectWithoutNhatKyInput
    upsert?: NguoiDungCSRUpsertWithoutNhatKyInput
    connect?: NguoiDungCSRWhereUniqueInput
    update?: XOR<XOR<NguoiDungCSRUpdateToOneWithWhereWithoutNhatKyInput, NguoiDungCSRUpdateWithoutNhatKyInput>, NguoiDungCSRUncheckedUpdateWithoutNhatKyInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type BuoiKhamCreateWithoutCoSoInput = {
    id?: string
    ngayKham: Date | string
    xa: string
    diaDiem: string
    ghiChu?: string | null
    createdAt?: Date | string
    syncStatus?: string
    nguoiTaoRef: NguoiDungCSRCreateNestedOneWithoutBuoiKhamTaoInput
    hoSo?: HoSoBenhNhanCreateNestedManyWithoutBuoiKhamInput
  }

  export type BuoiKhamUncheckedCreateWithoutCoSoInput = {
    id?: string
    ngayKham: Date | string
    xa: string
    diaDiem: string
    ghiChu?: string | null
    nguoiTao: string
    createdAt?: Date | string
    syncStatus?: string
    hoSo?: HoSoBenhNhanUncheckedCreateNestedManyWithoutBuoiKhamInput
  }

  export type BuoiKhamCreateOrConnectWithoutCoSoInput = {
    where: BuoiKhamWhereUniqueInput
    create: XOR<BuoiKhamCreateWithoutCoSoInput, BuoiKhamUncheckedCreateWithoutCoSoInput>
  }

  export type BuoiKhamCreateManyCoSoInputEnvelope = {
    data: BuoiKhamCreateManyCoSoInput | BuoiKhamCreateManyCoSoInput[]
  }

  export type NguoiDungCSRCreateWithoutCoSoInput = {
    maNV: string
    hoTen: string
    vaiTro: string
    tenDangNhap: string
    matKhauHash: string
    trangThai?: string
    buoiKhamTao?: BuoiKhamCreateNestedManyWithoutNguoiTaoRefInput
    hoSoTuVan?: HoSoBenhNhanCreateNestedManyWithoutTuVanVienInput
    hoSoPhuTrach?: HoSoBenhNhanCreateNestedManyWithoutNguoiPhuTrachInput
    hoSoChotCuoi?: HoSoBenhNhanCreateNestedManyWithoutNguoiChotCuoiInput
    nhatKy?: NhatKyTheoDoiCreateNestedManyWithoutNguoiGoiInput
  }

  export type NguoiDungCSRUncheckedCreateWithoutCoSoInput = {
    maNV: string
    hoTen: string
    vaiTro: string
    tenDangNhap: string
    matKhauHash: string
    trangThai?: string
    buoiKhamTao?: BuoiKhamUncheckedCreateNestedManyWithoutNguoiTaoRefInput
    hoSoTuVan?: HoSoBenhNhanUncheckedCreateNestedManyWithoutTuVanVienInput
    hoSoPhuTrach?: HoSoBenhNhanUncheckedCreateNestedManyWithoutNguoiPhuTrachInput
    hoSoChotCuoi?: HoSoBenhNhanUncheckedCreateNestedManyWithoutNguoiChotCuoiInput
    nhatKy?: NhatKyTheoDoiUncheckedCreateNestedManyWithoutNguoiGoiInput
  }

  export type NguoiDungCSRCreateOrConnectWithoutCoSoInput = {
    where: NguoiDungCSRWhereUniqueInput
    create: XOR<NguoiDungCSRCreateWithoutCoSoInput, NguoiDungCSRUncheckedCreateWithoutCoSoInput>
  }

  export type NguoiDungCSRCreateManyCoSoInputEnvelope = {
    data: NguoiDungCSRCreateManyCoSoInput | NguoiDungCSRCreateManyCoSoInput[]
  }

  export type HoSoBenhNhanCreateWithoutCoSoInput = {
    id?: string
    maBN: string
    maBNHIS?: string | null
    stt: number
    hoTen: string
    gioiTinh: string
    ngaySinh?: Date | string | null
    namSinh: number
    cccd?: string | null
    diaChi?: string | null
    sdt?: string | null
    sdtNguoiNha?: string | null
    thiLucMP?: string | null
    thiLucMT?: string | null
    chanDoan?: string
    chanDoanKhac?: string | null
    khuyenNghi?: string | null
    bhyt?: string | null
    soTienBao?: number | null
    ngayDieuTri?: Date | string | null
    diemDon?: string | null
    gioDon?: string | null
    nhom?: string | null
    followUpStatus?: string | null
    ngayChot?: Date | string | null
    daDon?: boolean
    ngayMoThucTe?: Date | string | null
    soTienThucThu?: number | null
    trangThaiDieuTri?: string | null
    ngayTaiKham?: Date | string | null
    ghiChuMat2?: string | null
    trangThai?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    createdBy?: string | null
    updatedBy?: string | null
    syncStatus?: string
    buoiKham: BuoiKhamCreateNestedOneWithoutHoSoInput
    tuVanVien?: NguoiDungCSRCreateNestedOneWithoutHoSoTuVanInput
    nguoiPhuTrach?: NguoiDungCSRCreateNestedOneWithoutHoSoPhuTrachInput
    nguoiChotCuoi?: NguoiDungCSRCreateNestedOneWithoutHoSoChotCuoiInput
    nhatKy?: NhatKyTheoDoiCreateNestedManyWithoutHoSoInput
  }

  export type HoSoBenhNhanUncheckedCreateWithoutCoSoInput = {
    id?: string
    maBN: string
    maBNHIS?: string | null
    stt: number
    buoiKhamId: string
    hoTen: string
    gioiTinh: string
    ngaySinh?: Date | string | null
    namSinh: number
    cccd?: string | null
    diaChi?: string | null
    sdt?: string | null
    sdtNguoiNha?: string | null
    thiLucMP?: string | null
    thiLucMT?: string | null
    chanDoan?: string
    chanDoanKhac?: string | null
    khuyenNghi?: string | null
    bhyt?: string | null
    tuVanVienMa?: string | null
    soTienBao?: number | null
    ngayDieuTri?: Date | string | null
    diemDon?: string | null
    gioDon?: string | null
    nhom?: string | null
    followUpStatus?: string | null
    nguoiPhuTrachMa?: string | null
    nguoiChotCuoiMa?: string | null
    ngayChot?: Date | string | null
    daDon?: boolean
    ngayMoThucTe?: Date | string | null
    soTienThucThu?: number | null
    trangThaiDieuTri?: string | null
    ngayTaiKham?: Date | string | null
    ghiChuMat2?: string | null
    trangThai?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    createdBy?: string | null
    updatedBy?: string | null
    syncStatus?: string
    nhatKy?: NhatKyTheoDoiUncheckedCreateNestedManyWithoutHoSoInput
  }

  export type HoSoBenhNhanCreateOrConnectWithoutCoSoInput = {
    where: HoSoBenhNhanWhereUniqueInput
    create: XOR<HoSoBenhNhanCreateWithoutCoSoInput, HoSoBenhNhanUncheckedCreateWithoutCoSoInput>
  }

  export type HoSoBenhNhanCreateManyCoSoInputEnvelope = {
    data: HoSoBenhNhanCreateManyCoSoInput | HoSoBenhNhanCreateManyCoSoInput[]
  }

  export type BuoiKhamUpsertWithWhereUniqueWithoutCoSoInput = {
    where: BuoiKhamWhereUniqueInput
    update: XOR<BuoiKhamUpdateWithoutCoSoInput, BuoiKhamUncheckedUpdateWithoutCoSoInput>
    create: XOR<BuoiKhamCreateWithoutCoSoInput, BuoiKhamUncheckedCreateWithoutCoSoInput>
  }

  export type BuoiKhamUpdateWithWhereUniqueWithoutCoSoInput = {
    where: BuoiKhamWhereUniqueInput
    data: XOR<BuoiKhamUpdateWithoutCoSoInput, BuoiKhamUncheckedUpdateWithoutCoSoInput>
  }

  export type BuoiKhamUpdateManyWithWhereWithoutCoSoInput = {
    where: BuoiKhamScalarWhereInput
    data: XOR<BuoiKhamUpdateManyMutationInput, BuoiKhamUncheckedUpdateManyWithoutCoSoInput>
  }

  export type BuoiKhamScalarWhereInput = {
    AND?: BuoiKhamScalarWhereInput | BuoiKhamScalarWhereInput[]
    OR?: BuoiKhamScalarWhereInput[]
    NOT?: BuoiKhamScalarWhereInput | BuoiKhamScalarWhereInput[]
    id?: StringFilter<"BuoiKham"> | string
    coSoId?: StringFilter<"BuoiKham"> | string
    ngayKham?: DateTimeFilter<"BuoiKham"> | Date | string
    xa?: StringFilter<"BuoiKham"> | string
    diaDiem?: StringFilter<"BuoiKham"> | string
    ghiChu?: StringNullableFilter<"BuoiKham"> | string | null
    nguoiTao?: StringFilter<"BuoiKham"> | string
    createdAt?: DateTimeFilter<"BuoiKham"> | Date | string
    syncStatus?: StringFilter<"BuoiKham"> | string
  }

  export type NguoiDungCSRUpsertWithWhereUniqueWithoutCoSoInput = {
    where: NguoiDungCSRWhereUniqueInput
    update: XOR<NguoiDungCSRUpdateWithoutCoSoInput, NguoiDungCSRUncheckedUpdateWithoutCoSoInput>
    create: XOR<NguoiDungCSRCreateWithoutCoSoInput, NguoiDungCSRUncheckedCreateWithoutCoSoInput>
  }

  export type NguoiDungCSRUpdateWithWhereUniqueWithoutCoSoInput = {
    where: NguoiDungCSRWhereUniqueInput
    data: XOR<NguoiDungCSRUpdateWithoutCoSoInput, NguoiDungCSRUncheckedUpdateWithoutCoSoInput>
  }

  export type NguoiDungCSRUpdateManyWithWhereWithoutCoSoInput = {
    where: NguoiDungCSRScalarWhereInput
    data: XOR<NguoiDungCSRUpdateManyMutationInput, NguoiDungCSRUncheckedUpdateManyWithoutCoSoInput>
  }

  export type NguoiDungCSRScalarWhereInput = {
    AND?: NguoiDungCSRScalarWhereInput | NguoiDungCSRScalarWhereInput[]
    OR?: NguoiDungCSRScalarWhereInput[]
    NOT?: NguoiDungCSRScalarWhereInput | NguoiDungCSRScalarWhereInput[]
    maNV?: StringFilter<"NguoiDungCSR"> | string
    hoTen?: StringFilter<"NguoiDungCSR"> | string
    vaiTro?: StringFilter<"NguoiDungCSR"> | string
    coSoId?: StringNullableFilter<"NguoiDungCSR"> | string | null
    tenDangNhap?: StringFilter<"NguoiDungCSR"> | string
    matKhauHash?: StringFilter<"NguoiDungCSR"> | string
    trangThai?: StringFilter<"NguoiDungCSR"> | string
  }

  export type HoSoBenhNhanUpsertWithWhereUniqueWithoutCoSoInput = {
    where: HoSoBenhNhanWhereUniqueInput
    update: XOR<HoSoBenhNhanUpdateWithoutCoSoInput, HoSoBenhNhanUncheckedUpdateWithoutCoSoInput>
    create: XOR<HoSoBenhNhanCreateWithoutCoSoInput, HoSoBenhNhanUncheckedCreateWithoutCoSoInput>
  }

  export type HoSoBenhNhanUpdateWithWhereUniqueWithoutCoSoInput = {
    where: HoSoBenhNhanWhereUniqueInput
    data: XOR<HoSoBenhNhanUpdateWithoutCoSoInput, HoSoBenhNhanUncheckedUpdateWithoutCoSoInput>
  }

  export type HoSoBenhNhanUpdateManyWithWhereWithoutCoSoInput = {
    where: HoSoBenhNhanScalarWhereInput
    data: XOR<HoSoBenhNhanUpdateManyMutationInput, HoSoBenhNhanUncheckedUpdateManyWithoutCoSoInput>
  }

  export type HoSoBenhNhanScalarWhereInput = {
    AND?: HoSoBenhNhanScalarWhereInput | HoSoBenhNhanScalarWhereInput[]
    OR?: HoSoBenhNhanScalarWhereInput[]
    NOT?: HoSoBenhNhanScalarWhereInput | HoSoBenhNhanScalarWhereInput[]
    id?: StringFilter<"HoSoBenhNhan"> | string
    maBN?: StringFilter<"HoSoBenhNhan"> | string
    maBNHIS?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    stt?: IntFilter<"HoSoBenhNhan"> | number
    buoiKhamId?: StringFilter<"HoSoBenhNhan"> | string
    coSoId?: StringFilter<"HoSoBenhNhan"> | string
    hoTen?: StringFilter<"HoSoBenhNhan"> | string
    gioiTinh?: StringFilter<"HoSoBenhNhan"> | string
    ngaySinh?: DateTimeNullableFilter<"HoSoBenhNhan"> | Date | string | null
    namSinh?: IntFilter<"HoSoBenhNhan"> | number
    cccd?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    diaChi?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    sdt?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    sdtNguoiNha?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    thiLucMP?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    thiLucMT?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    chanDoan?: StringFilter<"HoSoBenhNhan"> | string
    chanDoanKhac?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    khuyenNghi?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    bhyt?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    tuVanVienMa?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    soTienBao?: FloatNullableFilter<"HoSoBenhNhan"> | number | null
    ngayDieuTri?: DateTimeNullableFilter<"HoSoBenhNhan"> | Date | string | null
    diemDon?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    gioDon?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    nhom?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    followUpStatus?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    nguoiPhuTrachMa?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    nguoiChotCuoiMa?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    ngayChot?: DateTimeNullableFilter<"HoSoBenhNhan"> | Date | string | null
    daDon?: BoolFilter<"HoSoBenhNhan"> | boolean
    ngayMoThucTe?: DateTimeNullableFilter<"HoSoBenhNhan"> | Date | string | null
    soTienThucThu?: FloatNullableFilter<"HoSoBenhNhan"> | number | null
    trangThaiDieuTri?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    ngayTaiKham?: DateTimeNullableFilter<"HoSoBenhNhan"> | Date | string | null
    ghiChuMat2?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    trangThai?: StringFilter<"HoSoBenhNhan"> | string
    createdAt?: DateTimeFilter<"HoSoBenhNhan"> | Date | string
    updatedAt?: DateTimeFilter<"HoSoBenhNhan"> | Date | string
    createdBy?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    updatedBy?: StringNullableFilter<"HoSoBenhNhan"> | string | null
    syncStatus?: StringFilter<"HoSoBenhNhan"> | string
  }

  export type CoSoCreateWithoutNguoiDungInput = {
    id: string
    ten: string
    diaChi?: string | null
    trangThai?: string
    sheetId?: string | null
    bhxhUser?: string | null
    bhxhPass?: string | null
    bhxhMaCSKCB?: string | null
    bhxhHoTenCB?: string | null
    bhxhCccdCB?: string | null
    hisHost?: string | null
    hisPort?: string | null
    hisUser?: string | null
    hisPass?: string | null
    hisDbName?: string | null
    buoiKham?: BuoiKhamCreateNestedManyWithoutCoSoInput
    hoSo?: HoSoBenhNhanCreateNestedManyWithoutCoSoInput
  }

  export type CoSoUncheckedCreateWithoutNguoiDungInput = {
    id: string
    ten: string
    diaChi?: string | null
    trangThai?: string
    sheetId?: string | null
    bhxhUser?: string | null
    bhxhPass?: string | null
    bhxhMaCSKCB?: string | null
    bhxhHoTenCB?: string | null
    bhxhCccdCB?: string | null
    hisHost?: string | null
    hisPort?: string | null
    hisUser?: string | null
    hisPass?: string | null
    hisDbName?: string | null
    buoiKham?: BuoiKhamUncheckedCreateNestedManyWithoutCoSoInput
    hoSo?: HoSoBenhNhanUncheckedCreateNestedManyWithoutCoSoInput
  }

  export type CoSoCreateOrConnectWithoutNguoiDungInput = {
    where: CoSoWhereUniqueInput
    create: XOR<CoSoCreateWithoutNguoiDungInput, CoSoUncheckedCreateWithoutNguoiDungInput>
  }

  export type BuoiKhamCreateWithoutNguoiTaoRefInput = {
    id?: string
    ngayKham: Date | string
    xa: string
    diaDiem: string
    ghiChu?: string | null
    createdAt?: Date | string
    syncStatus?: string
    coSo: CoSoCreateNestedOneWithoutBuoiKhamInput
    hoSo?: HoSoBenhNhanCreateNestedManyWithoutBuoiKhamInput
  }

  export type BuoiKhamUncheckedCreateWithoutNguoiTaoRefInput = {
    id?: string
    coSoId: string
    ngayKham: Date | string
    xa: string
    diaDiem: string
    ghiChu?: string | null
    createdAt?: Date | string
    syncStatus?: string
    hoSo?: HoSoBenhNhanUncheckedCreateNestedManyWithoutBuoiKhamInput
  }

  export type BuoiKhamCreateOrConnectWithoutNguoiTaoRefInput = {
    where: BuoiKhamWhereUniqueInput
    create: XOR<BuoiKhamCreateWithoutNguoiTaoRefInput, BuoiKhamUncheckedCreateWithoutNguoiTaoRefInput>
  }

  export type BuoiKhamCreateManyNguoiTaoRefInputEnvelope = {
    data: BuoiKhamCreateManyNguoiTaoRefInput | BuoiKhamCreateManyNguoiTaoRefInput[]
  }

  export type HoSoBenhNhanCreateWithoutTuVanVienInput = {
    id?: string
    maBN: string
    maBNHIS?: string | null
    stt: number
    hoTen: string
    gioiTinh: string
    ngaySinh?: Date | string | null
    namSinh: number
    cccd?: string | null
    diaChi?: string | null
    sdt?: string | null
    sdtNguoiNha?: string | null
    thiLucMP?: string | null
    thiLucMT?: string | null
    chanDoan?: string
    chanDoanKhac?: string | null
    khuyenNghi?: string | null
    bhyt?: string | null
    soTienBao?: number | null
    ngayDieuTri?: Date | string | null
    diemDon?: string | null
    gioDon?: string | null
    nhom?: string | null
    followUpStatus?: string | null
    ngayChot?: Date | string | null
    daDon?: boolean
    ngayMoThucTe?: Date | string | null
    soTienThucThu?: number | null
    trangThaiDieuTri?: string | null
    ngayTaiKham?: Date | string | null
    ghiChuMat2?: string | null
    trangThai?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    createdBy?: string | null
    updatedBy?: string | null
    syncStatus?: string
    buoiKham: BuoiKhamCreateNestedOneWithoutHoSoInput
    coSo: CoSoCreateNestedOneWithoutHoSoInput
    nguoiPhuTrach?: NguoiDungCSRCreateNestedOneWithoutHoSoPhuTrachInput
    nguoiChotCuoi?: NguoiDungCSRCreateNestedOneWithoutHoSoChotCuoiInput
    nhatKy?: NhatKyTheoDoiCreateNestedManyWithoutHoSoInput
  }

  export type HoSoBenhNhanUncheckedCreateWithoutTuVanVienInput = {
    id?: string
    maBN: string
    maBNHIS?: string | null
    stt: number
    buoiKhamId: string
    coSoId: string
    hoTen: string
    gioiTinh: string
    ngaySinh?: Date | string | null
    namSinh: number
    cccd?: string | null
    diaChi?: string | null
    sdt?: string | null
    sdtNguoiNha?: string | null
    thiLucMP?: string | null
    thiLucMT?: string | null
    chanDoan?: string
    chanDoanKhac?: string | null
    khuyenNghi?: string | null
    bhyt?: string | null
    soTienBao?: number | null
    ngayDieuTri?: Date | string | null
    diemDon?: string | null
    gioDon?: string | null
    nhom?: string | null
    followUpStatus?: string | null
    nguoiPhuTrachMa?: string | null
    nguoiChotCuoiMa?: string | null
    ngayChot?: Date | string | null
    daDon?: boolean
    ngayMoThucTe?: Date | string | null
    soTienThucThu?: number | null
    trangThaiDieuTri?: string | null
    ngayTaiKham?: Date | string | null
    ghiChuMat2?: string | null
    trangThai?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    createdBy?: string | null
    updatedBy?: string | null
    syncStatus?: string
    nhatKy?: NhatKyTheoDoiUncheckedCreateNestedManyWithoutHoSoInput
  }

  export type HoSoBenhNhanCreateOrConnectWithoutTuVanVienInput = {
    where: HoSoBenhNhanWhereUniqueInput
    create: XOR<HoSoBenhNhanCreateWithoutTuVanVienInput, HoSoBenhNhanUncheckedCreateWithoutTuVanVienInput>
  }

  export type HoSoBenhNhanCreateManyTuVanVienInputEnvelope = {
    data: HoSoBenhNhanCreateManyTuVanVienInput | HoSoBenhNhanCreateManyTuVanVienInput[]
  }

  export type HoSoBenhNhanCreateWithoutNguoiPhuTrachInput = {
    id?: string
    maBN: string
    maBNHIS?: string | null
    stt: number
    hoTen: string
    gioiTinh: string
    ngaySinh?: Date | string | null
    namSinh: number
    cccd?: string | null
    diaChi?: string | null
    sdt?: string | null
    sdtNguoiNha?: string | null
    thiLucMP?: string | null
    thiLucMT?: string | null
    chanDoan?: string
    chanDoanKhac?: string | null
    khuyenNghi?: string | null
    bhyt?: string | null
    soTienBao?: number | null
    ngayDieuTri?: Date | string | null
    diemDon?: string | null
    gioDon?: string | null
    nhom?: string | null
    followUpStatus?: string | null
    ngayChot?: Date | string | null
    daDon?: boolean
    ngayMoThucTe?: Date | string | null
    soTienThucThu?: number | null
    trangThaiDieuTri?: string | null
    ngayTaiKham?: Date | string | null
    ghiChuMat2?: string | null
    trangThai?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    createdBy?: string | null
    updatedBy?: string | null
    syncStatus?: string
    buoiKham: BuoiKhamCreateNestedOneWithoutHoSoInput
    coSo: CoSoCreateNestedOneWithoutHoSoInput
    tuVanVien?: NguoiDungCSRCreateNestedOneWithoutHoSoTuVanInput
    nguoiChotCuoi?: NguoiDungCSRCreateNestedOneWithoutHoSoChotCuoiInput
    nhatKy?: NhatKyTheoDoiCreateNestedManyWithoutHoSoInput
  }

  export type HoSoBenhNhanUncheckedCreateWithoutNguoiPhuTrachInput = {
    id?: string
    maBN: string
    maBNHIS?: string | null
    stt: number
    buoiKhamId: string
    coSoId: string
    hoTen: string
    gioiTinh: string
    ngaySinh?: Date | string | null
    namSinh: number
    cccd?: string | null
    diaChi?: string | null
    sdt?: string | null
    sdtNguoiNha?: string | null
    thiLucMP?: string | null
    thiLucMT?: string | null
    chanDoan?: string
    chanDoanKhac?: string | null
    khuyenNghi?: string | null
    bhyt?: string | null
    tuVanVienMa?: string | null
    soTienBao?: number | null
    ngayDieuTri?: Date | string | null
    diemDon?: string | null
    gioDon?: string | null
    nhom?: string | null
    followUpStatus?: string | null
    nguoiChotCuoiMa?: string | null
    ngayChot?: Date | string | null
    daDon?: boolean
    ngayMoThucTe?: Date | string | null
    soTienThucThu?: number | null
    trangThaiDieuTri?: string | null
    ngayTaiKham?: Date | string | null
    ghiChuMat2?: string | null
    trangThai?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    createdBy?: string | null
    updatedBy?: string | null
    syncStatus?: string
    nhatKy?: NhatKyTheoDoiUncheckedCreateNestedManyWithoutHoSoInput
  }

  export type HoSoBenhNhanCreateOrConnectWithoutNguoiPhuTrachInput = {
    where: HoSoBenhNhanWhereUniqueInput
    create: XOR<HoSoBenhNhanCreateWithoutNguoiPhuTrachInput, HoSoBenhNhanUncheckedCreateWithoutNguoiPhuTrachInput>
  }

  export type HoSoBenhNhanCreateManyNguoiPhuTrachInputEnvelope = {
    data: HoSoBenhNhanCreateManyNguoiPhuTrachInput | HoSoBenhNhanCreateManyNguoiPhuTrachInput[]
  }

  export type HoSoBenhNhanCreateWithoutNguoiChotCuoiInput = {
    id?: string
    maBN: string
    maBNHIS?: string | null
    stt: number
    hoTen: string
    gioiTinh: string
    ngaySinh?: Date | string | null
    namSinh: number
    cccd?: string | null
    diaChi?: string | null
    sdt?: string | null
    sdtNguoiNha?: string | null
    thiLucMP?: string | null
    thiLucMT?: string | null
    chanDoan?: string
    chanDoanKhac?: string | null
    khuyenNghi?: string | null
    bhyt?: string | null
    soTienBao?: number | null
    ngayDieuTri?: Date | string | null
    diemDon?: string | null
    gioDon?: string | null
    nhom?: string | null
    followUpStatus?: string | null
    ngayChot?: Date | string | null
    daDon?: boolean
    ngayMoThucTe?: Date | string | null
    soTienThucThu?: number | null
    trangThaiDieuTri?: string | null
    ngayTaiKham?: Date | string | null
    ghiChuMat2?: string | null
    trangThai?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    createdBy?: string | null
    updatedBy?: string | null
    syncStatus?: string
    buoiKham: BuoiKhamCreateNestedOneWithoutHoSoInput
    coSo: CoSoCreateNestedOneWithoutHoSoInput
    tuVanVien?: NguoiDungCSRCreateNestedOneWithoutHoSoTuVanInput
    nguoiPhuTrach?: NguoiDungCSRCreateNestedOneWithoutHoSoPhuTrachInput
    nhatKy?: NhatKyTheoDoiCreateNestedManyWithoutHoSoInput
  }

  export type HoSoBenhNhanUncheckedCreateWithoutNguoiChotCuoiInput = {
    id?: string
    maBN: string
    maBNHIS?: string | null
    stt: number
    buoiKhamId: string
    coSoId: string
    hoTen: string
    gioiTinh: string
    ngaySinh?: Date | string | null
    namSinh: number
    cccd?: string | null
    diaChi?: string | null
    sdt?: string | null
    sdtNguoiNha?: string | null
    thiLucMP?: string | null
    thiLucMT?: string | null
    chanDoan?: string
    chanDoanKhac?: string | null
    khuyenNghi?: string | null
    bhyt?: string | null
    tuVanVienMa?: string | null
    soTienBao?: number | null
    ngayDieuTri?: Date | string | null
    diemDon?: string | null
    gioDon?: string | null
    nhom?: string | null
    followUpStatus?: string | null
    nguoiPhuTrachMa?: string | null
    ngayChot?: Date | string | null
    daDon?: boolean
    ngayMoThucTe?: Date | string | null
    soTienThucThu?: number | null
    trangThaiDieuTri?: string | null
    ngayTaiKham?: Date | string | null
    ghiChuMat2?: string | null
    trangThai?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    createdBy?: string | null
    updatedBy?: string | null
    syncStatus?: string
    nhatKy?: NhatKyTheoDoiUncheckedCreateNestedManyWithoutHoSoInput
  }

  export type HoSoBenhNhanCreateOrConnectWithoutNguoiChotCuoiInput = {
    where: HoSoBenhNhanWhereUniqueInput
    create: XOR<HoSoBenhNhanCreateWithoutNguoiChotCuoiInput, HoSoBenhNhanUncheckedCreateWithoutNguoiChotCuoiInput>
  }

  export type HoSoBenhNhanCreateManyNguoiChotCuoiInputEnvelope = {
    data: HoSoBenhNhanCreateManyNguoiChotCuoiInput | HoSoBenhNhanCreateManyNguoiChotCuoiInput[]
  }

  export type NhatKyTheoDoiCreateWithoutNguoiGoiInput = {
    id?: string
    ngay: Date | string
    noiDung: string
    syncStatus?: string
    hoSo: HoSoBenhNhanCreateNestedOneWithoutNhatKyInput
  }

  export type NhatKyTheoDoiUncheckedCreateWithoutNguoiGoiInput = {
    id?: string
    hoSoId: string
    ngay: Date | string
    noiDung: string
    syncStatus?: string
  }

  export type NhatKyTheoDoiCreateOrConnectWithoutNguoiGoiInput = {
    where: NhatKyTheoDoiWhereUniqueInput
    create: XOR<NhatKyTheoDoiCreateWithoutNguoiGoiInput, NhatKyTheoDoiUncheckedCreateWithoutNguoiGoiInput>
  }

  export type NhatKyTheoDoiCreateManyNguoiGoiInputEnvelope = {
    data: NhatKyTheoDoiCreateManyNguoiGoiInput | NhatKyTheoDoiCreateManyNguoiGoiInput[]
  }

  export type CoSoUpsertWithoutNguoiDungInput = {
    update: XOR<CoSoUpdateWithoutNguoiDungInput, CoSoUncheckedUpdateWithoutNguoiDungInput>
    create: XOR<CoSoCreateWithoutNguoiDungInput, CoSoUncheckedCreateWithoutNguoiDungInput>
    where?: CoSoWhereInput
  }

  export type CoSoUpdateToOneWithWhereWithoutNguoiDungInput = {
    where?: CoSoWhereInput
    data: XOR<CoSoUpdateWithoutNguoiDungInput, CoSoUncheckedUpdateWithoutNguoiDungInput>
  }

  export type CoSoUpdateWithoutNguoiDungInput = {
    id?: StringFieldUpdateOperationsInput | string
    ten?: StringFieldUpdateOperationsInput | string
    diaChi?: NullableStringFieldUpdateOperationsInput | string | null
    trangThai?: StringFieldUpdateOperationsInput | string
    sheetId?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhUser?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhPass?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhMaCSKCB?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhHoTenCB?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhCccdCB?: NullableStringFieldUpdateOperationsInput | string | null
    hisHost?: NullableStringFieldUpdateOperationsInput | string | null
    hisPort?: NullableStringFieldUpdateOperationsInput | string | null
    hisUser?: NullableStringFieldUpdateOperationsInput | string | null
    hisPass?: NullableStringFieldUpdateOperationsInput | string | null
    hisDbName?: NullableStringFieldUpdateOperationsInput | string | null
    buoiKham?: BuoiKhamUpdateManyWithoutCoSoNestedInput
    hoSo?: HoSoBenhNhanUpdateManyWithoutCoSoNestedInput
  }

  export type CoSoUncheckedUpdateWithoutNguoiDungInput = {
    id?: StringFieldUpdateOperationsInput | string
    ten?: StringFieldUpdateOperationsInput | string
    diaChi?: NullableStringFieldUpdateOperationsInput | string | null
    trangThai?: StringFieldUpdateOperationsInput | string
    sheetId?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhUser?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhPass?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhMaCSKCB?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhHoTenCB?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhCccdCB?: NullableStringFieldUpdateOperationsInput | string | null
    hisHost?: NullableStringFieldUpdateOperationsInput | string | null
    hisPort?: NullableStringFieldUpdateOperationsInput | string | null
    hisUser?: NullableStringFieldUpdateOperationsInput | string | null
    hisPass?: NullableStringFieldUpdateOperationsInput | string | null
    hisDbName?: NullableStringFieldUpdateOperationsInput | string | null
    buoiKham?: BuoiKhamUncheckedUpdateManyWithoutCoSoNestedInput
    hoSo?: HoSoBenhNhanUncheckedUpdateManyWithoutCoSoNestedInput
  }

  export type BuoiKhamUpsertWithWhereUniqueWithoutNguoiTaoRefInput = {
    where: BuoiKhamWhereUniqueInput
    update: XOR<BuoiKhamUpdateWithoutNguoiTaoRefInput, BuoiKhamUncheckedUpdateWithoutNguoiTaoRefInput>
    create: XOR<BuoiKhamCreateWithoutNguoiTaoRefInput, BuoiKhamUncheckedCreateWithoutNguoiTaoRefInput>
  }

  export type BuoiKhamUpdateWithWhereUniqueWithoutNguoiTaoRefInput = {
    where: BuoiKhamWhereUniqueInput
    data: XOR<BuoiKhamUpdateWithoutNguoiTaoRefInput, BuoiKhamUncheckedUpdateWithoutNguoiTaoRefInput>
  }

  export type BuoiKhamUpdateManyWithWhereWithoutNguoiTaoRefInput = {
    where: BuoiKhamScalarWhereInput
    data: XOR<BuoiKhamUpdateManyMutationInput, BuoiKhamUncheckedUpdateManyWithoutNguoiTaoRefInput>
  }

  export type HoSoBenhNhanUpsertWithWhereUniqueWithoutTuVanVienInput = {
    where: HoSoBenhNhanWhereUniqueInput
    update: XOR<HoSoBenhNhanUpdateWithoutTuVanVienInput, HoSoBenhNhanUncheckedUpdateWithoutTuVanVienInput>
    create: XOR<HoSoBenhNhanCreateWithoutTuVanVienInput, HoSoBenhNhanUncheckedCreateWithoutTuVanVienInput>
  }

  export type HoSoBenhNhanUpdateWithWhereUniqueWithoutTuVanVienInput = {
    where: HoSoBenhNhanWhereUniqueInput
    data: XOR<HoSoBenhNhanUpdateWithoutTuVanVienInput, HoSoBenhNhanUncheckedUpdateWithoutTuVanVienInput>
  }

  export type HoSoBenhNhanUpdateManyWithWhereWithoutTuVanVienInput = {
    where: HoSoBenhNhanScalarWhereInput
    data: XOR<HoSoBenhNhanUpdateManyMutationInput, HoSoBenhNhanUncheckedUpdateManyWithoutTuVanVienInput>
  }

  export type HoSoBenhNhanUpsertWithWhereUniqueWithoutNguoiPhuTrachInput = {
    where: HoSoBenhNhanWhereUniqueInput
    update: XOR<HoSoBenhNhanUpdateWithoutNguoiPhuTrachInput, HoSoBenhNhanUncheckedUpdateWithoutNguoiPhuTrachInput>
    create: XOR<HoSoBenhNhanCreateWithoutNguoiPhuTrachInput, HoSoBenhNhanUncheckedCreateWithoutNguoiPhuTrachInput>
  }

  export type HoSoBenhNhanUpdateWithWhereUniqueWithoutNguoiPhuTrachInput = {
    where: HoSoBenhNhanWhereUniqueInput
    data: XOR<HoSoBenhNhanUpdateWithoutNguoiPhuTrachInput, HoSoBenhNhanUncheckedUpdateWithoutNguoiPhuTrachInput>
  }

  export type HoSoBenhNhanUpdateManyWithWhereWithoutNguoiPhuTrachInput = {
    where: HoSoBenhNhanScalarWhereInput
    data: XOR<HoSoBenhNhanUpdateManyMutationInput, HoSoBenhNhanUncheckedUpdateManyWithoutNguoiPhuTrachInput>
  }

  export type HoSoBenhNhanUpsertWithWhereUniqueWithoutNguoiChotCuoiInput = {
    where: HoSoBenhNhanWhereUniqueInput
    update: XOR<HoSoBenhNhanUpdateWithoutNguoiChotCuoiInput, HoSoBenhNhanUncheckedUpdateWithoutNguoiChotCuoiInput>
    create: XOR<HoSoBenhNhanCreateWithoutNguoiChotCuoiInput, HoSoBenhNhanUncheckedCreateWithoutNguoiChotCuoiInput>
  }

  export type HoSoBenhNhanUpdateWithWhereUniqueWithoutNguoiChotCuoiInput = {
    where: HoSoBenhNhanWhereUniqueInput
    data: XOR<HoSoBenhNhanUpdateWithoutNguoiChotCuoiInput, HoSoBenhNhanUncheckedUpdateWithoutNguoiChotCuoiInput>
  }

  export type HoSoBenhNhanUpdateManyWithWhereWithoutNguoiChotCuoiInput = {
    where: HoSoBenhNhanScalarWhereInput
    data: XOR<HoSoBenhNhanUpdateManyMutationInput, HoSoBenhNhanUncheckedUpdateManyWithoutNguoiChotCuoiInput>
  }

  export type NhatKyTheoDoiUpsertWithWhereUniqueWithoutNguoiGoiInput = {
    where: NhatKyTheoDoiWhereUniqueInput
    update: XOR<NhatKyTheoDoiUpdateWithoutNguoiGoiInput, NhatKyTheoDoiUncheckedUpdateWithoutNguoiGoiInput>
    create: XOR<NhatKyTheoDoiCreateWithoutNguoiGoiInput, NhatKyTheoDoiUncheckedCreateWithoutNguoiGoiInput>
  }

  export type NhatKyTheoDoiUpdateWithWhereUniqueWithoutNguoiGoiInput = {
    where: NhatKyTheoDoiWhereUniqueInput
    data: XOR<NhatKyTheoDoiUpdateWithoutNguoiGoiInput, NhatKyTheoDoiUncheckedUpdateWithoutNguoiGoiInput>
  }

  export type NhatKyTheoDoiUpdateManyWithWhereWithoutNguoiGoiInput = {
    where: NhatKyTheoDoiScalarWhereInput
    data: XOR<NhatKyTheoDoiUpdateManyMutationInput, NhatKyTheoDoiUncheckedUpdateManyWithoutNguoiGoiInput>
  }

  export type NhatKyTheoDoiScalarWhereInput = {
    AND?: NhatKyTheoDoiScalarWhereInput | NhatKyTheoDoiScalarWhereInput[]
    OR?: NhatKyTheoDoiScalarWhereInput[]
    NOT?: NhatKyTheoDoiScalarWhereInput | NhatKyTheoDoiScalarWhereInput[]
    id?: StringFilter<"NhatKyTheoDoi"> | string
    hoSoId?: StringFilter<"NhatKyTheoDoi"> | string
    ngay?: DateTimeFilter<"NhatKyTheoDoi"> | Date | string
    nguoiGoiMa?: StringFilter<"NhatKyTheoDoi"> | string
    noiDung?: StringFilter<"NhatKyTheoDoi"> | string
    syncStatus?: StringFilter<"NhatKyTheoDoi"> | string
  }

  export type CoSoCreateWithoutBuoiKhamInput = {
    id: string
    ten: string
    diaChi?: string | null
    trangThai?: string
    sheetId?: string | null
    bhxhUser?: string | null
    bhxhPass?: string | null
    bhxhMaCSKCB?: string | null
    bhxhHoTenCB?: string | null
    bhxhCccdCB?: string | null
    hisHost?: string | null
    hisPort?: string | null
    hisUser?: string | null
    hisPass?: string | null
    hisDbName?: string | null
    nguoiDung?: NguoiDungCSRCreateNestedManyWithoutCoSoInput
    hoSo?: HoSoBenhNhanCreateNestedManyWithoutCoSoInput
  }

  export type CoSoUncheckedCreateWithoutBuoiKhamInput = {
    id: string
    ten: string
    diaChi?: string | null
    trangThai?: string
    sheetId?: string | null
    bhxhUser?: string | null
    bhxhPass?: string | null
    bhxhMaCSKCB?: string | null
    bhxhHoTenCB?: string | null
    bhxhCccdCB?: string | null
    hisHost?: string | null
    hisPort?: string | null
    hisUser?: string | null
    hisPass?: string | null
    hisDbName?: string | null
    nguoiDung?: NguoiDungCSRUncheckedCreateNestedManyWithoutCoSoInput
    hoSo?: HoSoBenhNhanUncheckedCreateNestedManyWithoutCoSoInput
  }

  export type CoSoCreateOrConnectWithoutBuoiKhamInput = {
    where: CoSoWhereUniqueInput
    create: XOR<CoSoCreateWithoutBuoiKhamInput, CoSoUncheckedCreateWithoutBuoiKhamInput>
  }

  export type NguoiDungCSRCreateWithoutBuoiKhamTaoInput = {
    maNV: string
    hoTen: string
    vaiTro: string
    tenDangNhap: string
    matKhauHash: string
    trangThai?: string
    coSo?: CoSoCreateNestedOneWithoutNguoiDungInput
    hoSoTuVan?: HoSoBenhNhanCreateNestedManyWithoutTuVanVienInput
    hoSoPhuTrach?: HoSoBenhNhanCreateNestedManyWithoutNguoiPhuTrachInput
    hoSoChotCuoi?: HoSoBenhNhanCreateNestedManyWithoutNguoiChotCuoiInput
    nhatKy?: NhatKyTheoDoiCreateNestedManyWithoutNguoiGoiInput
  }

  export type NguoiDungCSRUncheckedCreateWithoutBuoiKhamTaoInput = {
    maNV: string
    hoTen: string
    vaiTro: string
    coSoId?: string | null
    tenDangNhap: string
    matKhauHash: string
    trangThai?: string
    hoSoTuVan?: HoSoBenhNhanUncheckedCreateNestedManyWithoutTuVanVienInput
    hoSoPhuTrach?: HoSoBenhNhanUncheckedCreateNestedManyWithoutNguoiPhuTrachInput
    hoSoChotCuoi?: HoSoBenhNhanUncheckedCreateNestedManyWithoutNguoiChotCuoiInput
    nhatKy?: NhatKyTheoDoiUncheckedCreateNestedManyWithoutNguoiGoiInput
  }

  export type NguoiDungCSRCreateOrConnectWithoutBuoiKhamTaoInput = {
    where: NguoiDungCSRWhereUniqueInput
    create: XOR<NguoiDungCSRCreateWithoutBuoiKhamTaoInput, NguoiDungCSRUncheckedCreateWithoutBuoiKhamTaoInput>
  }

  export type HoSoBenhNhanCreateWithoutBuoiKhamInput = {
    id?: string
    maBN: string
    maBNHIS?: string | null
    stt: number
    hoTen: string
    gioiTinh: string
    ngaySinh?: Date | string | null
    namSinh: number
    cccd?: string | null
    diaChi?: string | null
    sdt?: string | null
    sdtNguoiNha?: string | null
    thiLucMP?: string | null
    thiLucMT?: string | null
    chanDoan?: string
    chanDoanKhac?: string | null
    khuyenNghi?: string | null
    bhyt?: string | null
    soTienBao?: number | null
    ngayDieuTri?: Date | string | null
    diemDon?: string | null
    gioDon?: string | null
    nhom?: string | null
    followUpStatus?: string | null
    ngayChot?: Date | string | null
    daDon?: boolean
    ngayMoThucTe?: Date | string | null
    soTienThucThu?: number | null
    trangThaiDieuTri?: string | null
    ngayTaiKham?: Date | string | null
    ghiChuMat2?: string | null
    trangThai?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    createdBy?: string | null
    updatedBy?: string | null
    syncStatus?: string
    coSo: CoSoCreateNestedOneWithoutHoSoInput
    tuVanVien?: NguoiDungCSRCreateNestedOneWithoutHoSoTuVanInput
    nguoiPhuTrach?: NguoiDungCSRCreateNestedOneWithoutHoSoPhuTrachInput
    nguoiChotCuoi?: NguoiDungCSRCreateNestedOneWithoutHoSoChotCuoiInput
    nhatKy?: NhatKyTheoDoiCreateNestedManyWithoutHoSoInput
  }

  export type HoSoBenhNhanUncheckedCreateWithoutBuoiKhamInput = {
    id?: string
    maBN: string
    maBNHIS?: string | null
    stt: number
    coSoId: string
    hoTen: string
    gioiTinh: string
    ngaySinh?: Date | string | null
    namSinh: number
    cccd?: string | null
    diaChi?: string | null
    sdt?: string | null
    sdtNguoiNha?: string | null
    thiLucMP?: string | null
    thiLucMT?: string | null
    chanDoan?: string
    chanDoanKhac?: string | null
    khuyenNghi?: string | null
    bhyt?: string | null
    tuVanVienMa?: string | null
    soTienBao?: number | null
    ngayDieuTri?: Date | string | null
    diemDon?: string | null
    gioDon?: string | null
    nhom?: string | null
    followUpStatus?: string | null
    nguoiPhuTrachMa?: string | null
    nguoiChotCuoiMa?: string | null
    ngayChot?: Date | string | null
    daDon?: boolean
    ngayMoThucTe?: Date | string | null
    soTienThucThu?: number | null
    trangThaiDieuTri?: string | null
    ngayTaiKham?: Date | string | null
    ghiChuMat2?: string | null
    trangThai?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    createdBy?: string | null
    updatedBy?: string | null
    syncStatus?: string
    nhatKy?: NhatKyTheoDoiUncheckedCreateNestedManyWithoutHoSoInput
  }

  export type HoSoBenhNhanCreateOrConnectWithoutBuoiKhamInput = {
    where: HoSoBenhNhanWhereUniqueInput
    create: XOR<HoSoBenhNhanCreateWithoutBuoiKhamInput, HoSoBenhNhanUncheckedCreateWithoutBuoiKhamInput>
  }

  export type HoSoBenhNhanCreateManyBuoiKhamInputEnvelope = {
    data: HoSoBenhNhanCreateManyBuoiKhamInput | HoSoBenhNhanCreateManyBuoiKhamInput[]
  }

  export type CoSoUpsertWithoutBuoiKhamInput = {
    update: XOR<CoSoUpdateWithoutBuoiKhamInput, CoSoUncheckedUpdateWithoutBuoiKhamInput>
    create: XOR<CoSoCreateWithoutBuoiKhamInput, CoSoUncheckedCreateWithoutBuoiKhamInput>
    where?: CoSoWhereInput
  }

  export type CoSoUpdateToOneWithWhereWithoutBuoiKhamInput = {
    where?: CoSoWhereInput
    data: XOR<CoSoUpdateWithoutBuoiKhamInput, CoSoUncheckedUpdateWithoutBuoiKhamInput>
  }

  export type CoSoUpdateWithoutBuoiKhamInput = {
    id?: StringFieldUpdateOperationsInput | string
    ten?: StringFieldUpdateOperationsInput | string
    diaChi?: NullableStringFieldUpdateOperationsInput | string | null
    trangThai?: StringFieldUpdateOperationsInput | string
    sheetId?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhUser?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhPass?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhMaCSKCB?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhHoTenCB?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhCccdCB?: NullableStringFieldUpdateOperationsInput | string | null
    hisHost?: NullableStringFieldUpdateOperationsInput | string | null
    hisPort?: NullableStringFieldUpdateOperationsInput | string | null
    hisUser?: NullableStringFieldUpdateOperationsInput | string | null
    hisPass?: NullableStringFieldUpdateOperationsInput | string | null
    hisDbName?: NullableStringFieldUpdateOperationsInput | string | null
    nguoiDung?: NguoiDungCSRUpdateManyWithoutCoSoNestedInput
    hoSo?: HoSoBenhNhanUpdateManyWithoutCoSoNestedInput
  }

  export type CoSoUncheckedUpdateWithoutBuoiKhamInput = {
    id?: StringFieldUpdateOperationsInput | string
    ten?: StringFieldUpdateOperationsInput | string
    diaChi?: NullableStringFieldUpdateOperationsInput | string | null
    trangThai?: StringFieldUpdateOperationsInput | string
    sheetId?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhUser?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhPass?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhMaCSKCB?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhHoTenCB?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhCccdCB?: NullableStringFieldUpdateOperationsInput | string | null
    hisHost?: NullableStringFieldUpdateOperationsInput | string | null
    hisPort?: NullableStringFieldUpdateOperationsInput | string | null
    hisUser?: NullableStringFieldUpdateOperationsInput | string | null
    hisPass?: NullableStringFieldUpdateOperationsInput | string | null
    hisDbName?: NullableStringFieldUpdateOperationsInput | string | null
    nguoiDung?: NguoiDungCSRUncheckedUpdateManyWithoutCoSoNestedInput
    hoSo?: HoSoBenhNhanUncheckedUpdateManyWithoutCoSoNestedInput
  }

  export type NguoiDungCSRUpsertWithoutBuoiKhamTaoInput = {
    update: XOR<NguoiDungCSRUpdateWithoutBuoiKhamTaoInput, NguoiDungCSRUncheckedUpdateWithoutBuoiKhamTaoInput>
    create: XOR<NguoiDungCSRCreateWithoutBuoiKhamTaoInput, NguoiDungCSRUncheckedCreateWithoutBuoiKhamTaoInput>
    where?: NguoiDungCSRWhereInput
  }

  export type NguoiDungCSRUpdateToOneWithWhereWithoutBuoiKhamTaoInput = {
    where?: NguoiDungCSRWhereInput
    data: XOR<NguoiDungCSRUpdateWithoutBuoiKhamTaoInput, NguoiDungCSRUncheckedUpdateWithoutBuoiKhamTaoInput>
  }

  export type NguoiDungCSRUpdateWithoutBuoiKhamTaoInput = {
    maNV?: StringFieldUpdateOperationsInput | string
    hoTen?: StringFieldUpdateOperationsInput | string
    vaiTro?: StringFieldUpdateOperationsInput | string
    tenDangNhap?: StringFieldUpdateOperationsInput | string
    matKhauHash?: StringFieldUpdateOperationsInput | string
    trangThai?: StringFieldUpdateOperationsInput | string
    coSo?: CoSoUpdateOneWithoutNguoiDungNestedInput
    hoSoTuVan?: HoSoBenhNhanUpdateManyWithoutTuVanVienNestedInput
    hoSoPhuTrach?: HoSoBenhNhanUpdateManyWithoutNguoiPhuTrachNestedInput
    hoSoChotCuoi?: HoSoBenhNhanUpdateManyWithoutNguoiChotCuoiNestedInput
    nhatKy?: NhatKyTheoDoiUpdateManyWithoutNguoiGoiNestedInput
  }

  export type NguoiDungCSRUncheckedUpdateWithoutBuoiKhamTaoInput = {
    maNV?: StringFieldUpdateOperationsInput | string
    hoTen?: StringFieldUpdateOperationsInput | string
    vaiTro?: StringFieldUpdateOperationsInput | string
    coSoId?: NullableStringFieldUpdateOperationsInput | string | null
    tenDangNhap?: StringFieldUpdateOperationsInput | string
    matKhauHash?: StringFieldUpdateOperationsInput | string
    trangThai?: StringFieldUpdateOperationsInput | string
    hoSoTuVan?: HoSoBenhNhanUncheckedUpdateManyWithoutTuVanVienNestedInput
    hoSoPhuTrach?: HoSoBenhNhanUncheckedUpdateManyWithoutNguoiPhuTrachNestedInput
    hoSoChotCuoi?: HoSoBenhNhanUncheckedUpdateManyWithoutNguoiChotCuoiNestedInput
    nhatKy?: NhatKyTheoDoiUncheckedUpdateManyWithoutNguoiGoiNestedInput
  }

  export type HoSoBenhNhanUpsertWithWhereUniqueWithoutBuoiKhamInput = {
    where: HoSoBenhNhanWhereUniqueInput
    update: XOR<HoSoBenhNhanUpdateWithoutBuoiKhamInput, HoSoBenhNhanUncheckedUpdateWithoutBuoiKhamInput>
    create: XOR<HoSoBenhNhanCreateWithoutBuoiKhamInput, HoSoBenhNhanUncheckedCreateWithoutBuoiKhamInput>
  }

  export type HoSoBenhNhanUpdateWithWhereUniqueWithoutBuoiKhamInput = {
    where: HoSoBenhNhanWhereUniqueInput
    data: XOR<HoSoBenhNhanUpdateWithoutBuoiKhamInput, HoSoBenhNhanUncheckedUpdateWithoutBuoiKhamInput>
  }

  export type HoSoBenhNhanUpdateManyWithWhereWithoutBuoiKhamInput = {
    where: HoSoBenhNhanScalarWhereInput
    data: XOR<HoSoBenhNhanUpdateManyMutationInput, HoSoBenhNhanUncheckedUpdateManyWithoutBuoiKhamInput>
  }

  export type BuoiKhamCreateWithoutHoSoInput = {
    id?: string
    ngayKham: Date | string
    xa: string
    diaDiem: string
    ghiChu?: string | null
    createdAt?: Date | string
    syncStatus?: string
    coSo: CoSoCreateNestedOneWithoutBuoiKhamInput
    nguoiTaoRef: NguoiDungCSRCreateNestedOneWithoutBuoiKhamTaoInput
  }

  export type BuoiKhamUncheckedCreateWithoutHoSoInput = {
    id?: string
    coSoId: string
    ngayKham: Date | string
    xa: string
    diaDiem: string
    ghiChu?: string | null
    nguoiTao: string
    createdAt?: Date | string
    syncStatus?: string
  }

  export type BuoiKhamCreateOrConnectWithoutHoSoInput = {
    where: BuoiKhamWhereUniqueInput
    create: XOR<BuoiKhamCreateWithoutHoSoInput, BuoiKhamUncheckedCreateWithoutHoSoInput>
  }

  export type CoSoCreateWithoutHoSoInput = {
    id: string
    ten: string
    diaChi?: string | null
    trangThai?: string
    sheetId?: string | null
    bhxhUser?: string | null
    bhxhPass?: string | null
    bhxhMaCSKCB?: string | null
    bhxhHoTenCB?: string | null
    bhxhCccdCB?: string | null
    hisHost?: string | null
    hisPort?: string | null
    hisUser?: string | null
    hisPass?: string | null
    hisDbName?: string | null
    buoiKham?: BuoiKhamCreateNestedManyWithoutCoSoInput
    nguoiDung?: NguoiDungCSRCreateNestedManyWithoutCoSoInput
  }

  export type CoSoUncheckedCreateWithoutHoSoInput = {
    id: string
    ten: string
    diaChi?: string | null
    trangThai?: string
    sheetId?: string | null
    bhxhUser?: string | null
    bhxhPass?: string | null
    bhxhMaCSKCB?: string | null
    bhxhHoTenCB?: string | null
    bhxhCccdCB?: string | null
    hisHost?: string | null
    hisPort?: string | null
    hisUser?: string | null
    hisPass?: string | null
    hisDbName?: string | null
    buoiKham?: BuoiKhamUncheckedCreateNestedManyWithoutCoSoInput
    nguoiDung?: NguoiDungCSRUncheckedCreateNestedManyWithoutCoSoInput
  }

  export type CoSoCreateOrConnectWithoutHoSoInput = {
    where: CoSoWhereUniqueInput
    create: XOR<CoSoCreateWithoutHoSoInput, CoSoUncheckedCreateWithoutHoSoInput>
  }

  export type NguoiDungCSRCreateWithoutHoSoTuVanInput = {
    maNV: string
    hoTen: string
    vaiTro: string
    tenDangNhap: string
    matKhauHash: string
    trangThai?: string
    coSo?: CoSoCreateNestedOneWithoutNguoiDungInput
    buoiKhamTao?: BuoiKhamCreateNestedManyWithoutNguoiTaoRefInput
    hoSoPhuTrach?: HoSoBenhNhanCreateNestedManyWithoutNguoiPhuTrachInput
    hoSoChotCuoi?: HoSoBenhNhanCreateNestedManyWithoutNguoiChotCuoiInput
    nhatKy?: NhatKyTheoDoiCreateNestedManyWithoutNguoiGoiInput
  }

  export type NguoiDungCSRUncheckedCreateWithoutHoSoTuVanInput = {
    maNV: string
    hoTen: string
    vaiTro: string
    coSoId?: string | null
    tenDangNhap: string
    matKhauHash: string
    trangThai?: string
    buoiKhamTao?: BuoiKhamUncheckedCreateNestedManyWithoutNguoiTaoRefInput
    hoSoPhuTrach?: HoSoBenhNhanUncheckedCreateNestedManyWithoutNguoiPhuTrachInput
    hoSoChotCuoi?: HoSoBenhNhanUncheckedCreateNestedManyWithoutNguoiChotCuoiInput
    nhatKy?: NhatKyTheoDoiUncheckedCreateNestedManyWithoutNguoiGoiInput
  }

  export type NguoiDungCSRCreateOrConnectWithoutHoSoTuVanInput = {
    where: NguoiDungCSRWhereUniqueInput
    create: XOR<NguoiDungCSRCreateWithoutHoSoTuVanInput, NguoiDungCSRUncheckedCreateWithoutHoSoTuVanInput>
  }

  export type NguoiDungCSRCreateWithoutHoSoPhuTrachInput = {
    maNV: string
    hoTen: string
    vaiTro: string
    tenDangNhap: string
    matKhauHash: string
    trangThai?: string
    coSo?: CoSoCreateNestedOneWithoutNguoiDungInput
    buoiKhamTao?: BuoiKhamCreateNestedManyWithoutNguoiTaoRefInput
    hoSoTuVan?: HoSoBenhNhanCreateNestedManyWithoutTuVanVienInput
    hoSoChotCuoi?: HoSoBenhNhanCreateNestedManyWithoutNguoiChotCuoiInput
    nhatKy?: NhatKyTheoDoiCreateNestedManyWithoutNguoiGoiInput
  }

  export type NguoiDungCSRUncheckedCreateWithoutHoSoPhuTrachInput = {
    maNV: string
    hoTen: string
    vaiTro: string
    coSoId?: string | null
    tenDangNhap: string
    matKhauHash: string
    trangThai?: string
    buoiKhamTao?: BuoiKhamUncheckedCreateNestedManyWithoutNguoiTaoRefInput
    hoSoTuVan?: HoSoBenhNhanUncheckedCreateNestedManyWithoutTuVanVienInput
    hoSoChotCuoi?: HoSoBenhNhanUncheckedCreateNestedManyWithoutNguoiChotCuoiInput
    nhatKy?: NhatKyTheoDoiUncheckedCreateNestedManyWithoutNguoiGoiInput
  }

  export type NguoiDungCSRCreateOrConnectWithoutHoSoPhuTrachInput = {
    where: NguoiDungCSRWhereUniqueInput
    create: XOR<NguoiDungCSRCreateWithoutHoSoPhuTrachInput, NguoiDungCSRUncheckedCreateWithoutHoSoPhuTrachInput>
  }

  export type NguoiDungCSRCreateWithoutHoSoChotCuoiInput = {
    maNV: string
    hoTen: string
    vaiTro: string
    tenDangNhap: string
    matKhauHash: string
    trangThai?: string
    coSo?: CoSoCreateNestedOneWithoutNguoiDungInput
    buoiKhamTao?: BuoiKhamCreateNestedManyWithoutNguoiTaoRefInput
    hoSoTuVan?: HoSoBenhNhanCreateNestedManyWithoutTuVanVienInput
    hoSoPhuTrach?: HoSoBenhNhanCreateNestedManyWithoutNguoiPhuTrachInput
    nhatKy?: NhatKyTheoDoiCreateNestedManyWithoutNguoiGoiInput
  }

  export type NguoiDungCSRUncheckedCreateWithoutHoSoChotCuoiInput = {
    maNV: string
    hoTen: string
    vaiTro: string
    coSoId?: string | null
    tenDangNhap: string
    matKhauHash: string
    trangThai?: string
    buoiKhamTao?: BuoiKhamUncheckedCreateNestedManyWithoutNguoiTaoRefInput
    hoSoTuVan?: HoSoBenhNhanUncheckedCreateNestedManyWithoutTuVanVienInput
    hoSoPhuTrach?: HoSoBenhNhanUncheckedCreateNestedManyWithoutNguoiPhuTrachInput
    nhatKy?: NhatKyTheoDoiUncheckedCreateNestedManyWithoutNguoiGoiInput
  }

  export type NguoiDungCSRCreateOrConnectWithoutHoSoChotCuoiInput = {
    where: NguoiDungCSRWhereUniqueInput
    create: XOR<NguoiDungCSRCreateWithoutHoSoChotCuoiInput, NguoiDungCSRUncheckedCreateWithoutHoSoChotCuoiInput>
  }

  export type NhatKyTheoDoiCreateWithoutHoSoInput = {
    id?: string
    ngay: Date | string
    noiDung: string
    syncStatus?: string
    nguoiGoi: NguoiDungCSRCreateNestedOneWithoutNhatKyInput
  }

  export type NhatKyTheoDoiUncheckedCreateWithoutHoSoInput = {
    id?: string
    ngay: Date | string
    nguoiGoiMa: string
    noiDung: string
    syncStatus?: string
  }

  export type NhatKyTheoDoiCreateOrConnectWithoutHoSoInput = {
    where: NhatKyTheoDoiWhereUniqueInput
    create: XOR<NhatKyTheoDoiCreateWithoutHoSoInput, NhatKyTheoDoiUncheckedCreateWithoutHoSoInput>
  }

  export type NhatKyTheoDoiCreateManyHoSoInputEnvelope = {
    data: NhatKyTheoDoiCreateManyHoSoInput | NhatKyTheoDoiCreateManyHoSoInput[]
  }

  export type BuoiKhamUpsertWithoutHoSoInput = {
    update: XOR<BuoiKhamUpdateWithoutHoSoInput, BuoiKhamUncheckedUpdateWithoutHoSoInput>
    create: XOR<BuoiKhamCreateWithoutHoSoInput, BuoiKhamUncheckedCreateWithoutHoSoInput>
    where?: BuoiKhamWhereInput
  }

  export type BuoiKhamUpdateToOneWithWhereWithoutHoSoInput = {
    where?: BuoiKhamWhereInput
    data: XOR<BuoiKhamUpdateWithoutHoSoInput, BuoiKhamUncheckedUpdateWithoutHoSoInput>
  }

  export type BuoiKhamUpdateWithoutHoSoInput = {
    id?: StringFieldUpdateOperationsInput | string
    ngayKham?: DateTimeFieldUpdateOperationsInput | Date | string
    xa?: StringFieldUpdateOperationsInput | string
    diaDiem?: StringFieldUpdateOperationsInput | string
    ghiChu?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    syncStatus?: StringFieldUpdateOperationsInput | string
    coSo?: CoSoUpdateOneRequiredWithoutBuoiKhamNestedInput
    nguoiTaoRef?: NguoiDungCSRUpdateOneRequiredWithoutBuoiKhamTaoNestedInput
  }

  export type BuoiKhamUncheckedUpdateWithoutHoSoInput = {
    id?: StringFieldUpdateOperationsInput | string
    coSoId?: StringFieldUpdateOperationsInput | string
    ngayKham?: DateTimeFieldUpdateOperationsInput | Date | string
    xa?: StringFieldUpdateOperationsInput | string
    diaDiem?: StringFieldUpdateOperationsInput | string
    ghiChu?: NullableStringFieldUpdateOperationsInput | string | null
    nguoiTao?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    syncStatus?: StringFieldUpdateOperationsInput | string
  }

  export type CoSoUpsertWithoutHoSoInput = {
    update: XOR<CoSoUpdateWithoutHoSoInput, CoSoUncheckedUpdateWithoutHoSoInput>
    create: XOR<CoSoCreateWithoutHoSoInput, CoSoUncheckedCreateWithoutHoSoInput>
    where?: CoSoWhereInput
  }

  export type CoSoUpdateToOneWithWhereWithoutHoSoInput = {
    where?: CoSoWhereInput
    data: XOR<CoSoUpdateWithoutHoSoInput, CoSoUncheckedUpdateWithoutHoSoInput>
  }

  export type CoSoUpdateWithoutHoSoInput = {
    id?: StringFieldUpdateOperationsInput | string
    ten?: StringFieldUpdateOperationsInput | string
    diaChi?: NullableStringFieldUpdateOperationsInput | string | null
    trangThai?: StringFieldUpdateOperationsInput | string
    sheetId?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhUser?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhPass?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhMaCSKCB?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhHoTenCB?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhCccdCB?: NullableStringFieldUpdateOperationsInput | string | null
    hisHost?: NullableStringFieldUpdateOperationsInput | string | null
    hisPort?: NullableStringFieldUpdateOperationsInput | string | null
    hisUser?: NullableStringFieldUpdateOperationsInput | string | null
    hisPass?: NullableStringFieldUpdateOperationsInput | string | null
    hisDbName?: NullableStringFieldUpdateOperationsInput | string | null
    buoiKham?: BuoiKhamUpdateManyWithoutCoSoNestedInput
    nguoiDung?: NguoiDungCSRUpdateManyWithoutCoSoNestedInput
  }

  export type CoSoUncheckedUpdateWithoutHoSoInput = {
    id?: StringFieldUpdateOperationsInput | string
    ten?: StringFieldUpdateOperationsInput | string
    diaChi?: NullableStringFieldUpdateOperationsInput | string | null
    trangThai?: StringFieldUpdateOperationsInput | string
    sheetId?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhUser?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhPass?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhMaCSKCB?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhHoTenCB?: NullableStringFieldUpdateOperationsInput | string | null
    bhxhCccdCB?: NullableStringFieldUpdateOperationsInput | string | null
    hisHost?: NullableStringFieldUpdateOperationsInput | string | null
    hisPort?: NullableStringFieldUpdateOperationsInput | string | null
    hisUser?: NullableStringFieldUpdateOperationsInput | string | null
    hisPass?: NullableStringFieldUpdateOperationsInput | string | null
    hisDbName?: NullableStringFieldUpdateOperationsInput | string | null
    buoiKham?: BuoiKhamUncheckedUpdateManyWithoutCoSoNestedInput
    nguoiDung?: NguoiDungCSRUncheckedUpdateManyWithoutCoSoNestedInput
  }

  export type NguoiDungCSRUpsertWithoutHoSoTuVanInput = {
    update: XOR<NguoiDungCSRUpdateWithoutHoSoTuVanInput, NguoiDungCSRUncheckedUpdateWithoutHoSoTuVanInput>
    create: XOR<NguoiDungCSRCreateWithoutHoSoTuVanInput, NguoiDungCSRUncheckedCreateWithoutHoSoTuVanInput>
    where?: NguoiDungCSRWhereInput
  }

  export type NguoiDungCSRUpdateToOneWithWhereWithoutHoSoTuVanInput = {
    where?: NguoiDungCSRWhereInput
    data: XOR<NguoiDungCSRUpdateWithoutHoSoTuVanInput, NguoiDungCSRUncheckedUpdateWithoutHoSoTuVanInput>
  }

  export type NguoiDungCSRUpdateWithoutHoSoTuVanInput = {
    maNV?: StringFieldUpdateOperationsInput | string
    hoTen?: StringFieldUpdateOperationsInput | string
    vaiTro?: StringFieldUpdateOperationsInput | string
    tenDangNhap?: StringFieldUpdateOperationsInput | string
    matKhauHash?: StringFieldUpdateOperationsInput | string
    trangThai?: StringFieldUpdateOperationsInput | string
    coSo?: CoSoUpdateOneWithoutNguoiDungNestedInput
    buoiKhamTao?: BuoiKhamUpdateManyWithoutNguoiTaoRefNestedInput
    hoSoPhuTrach?: HoSoBenhNhanUpdateManyWithoutNguoiPhuTrachNestedInput
    hoSoChotCuoi?: HoSoBenhNhanUpdateManyWithoutNguoiChotCuoiNestedInput
    nhatKy?: NhatKyTheoDoiUpdateManyWithoutNguoiGoiNestedInput
  }

  export type NguoiDungCSRUncheckedUpdateWithoutHoSoTuVanInput = {
    maNV?: StringFieldUpdateOperationsInput | string
    hoTen?: StringFieldUpdateOperationsInput | string
    vaiTro?: StringFieldUpdateOperationsInput | string
    coSoId?: NullableStringFieldUpdateOperationsInput | string | null
    tenDangNhap?: StringFieldUpdateOperationsInput | string
    matKhauHash?: StringFieldUpdateOperationsInput | string
    trangThai?: StringFieldUpdateOperationsInput | string
    buoiKhamTao?: BuoiKhamUncheckedUpdateManyWithoutNguoiTaoRefNestedInput
    hoSoPhuTrach?: HoSoBenhNhanUncheckedUpdateManyWithoutNguoiPhuTrachNestedInput
    hoSoChotCuoi?: HoSoBenhNhanUncheckedUpdateManyWithoutNguoiChotCuoiNestedInput
    nhatKy?: NhatKyTheoDoiUncheckedUpdateManyWithoutNguoiGoiNestedInput
  }

  export type NguoiDungCSRUpsertWithoutHoSoPhuTrachInput = {
    update: XOR<NguoiDungCSRUpdateWithoutHoSoPhuTrachInput, NguoiDungCSRUncheckedUpdateWithoutHoSoPhuTrachInput>
    create: XOR<NguoiDungCSRCreateWithoutHoSoPhuTrachInput, NguoiDungCSRUncheckedCreateWithoutHoSoPhuTrachInput>
    where?: NguoiDungCSRWhereInput
  }

  export type NguoiDungCSRUpdateToOneWithWhereWithoutHoSoPhuTrachInput = {
    where?: NguoiDungCSRWhereInput
    data: XOR<NguoiDungCSRUpdateWithoutHoSoPhuTrachInput, NguoiDungCSRUncheckedUpdateWithoutHoSoPhuTrachInput>
  }

  export type NguoiDungCSRUpdateWithoutHoSoPhuTrachInput = {
    maNV?: StringFieldUpdateOperationsInput | string
    hoTen?: StringFieldUpdateOperationsInput | string
    vaiTro?: StringFieldUpdateOperationsInput | string
    tenDangNhap?: StringFieldUpdateOperationsInput | string
    matKhauHash?: StringFieldUpdateOperationsInput | string
    trangThai?: StringFieldUpdateOperationsInput | string
    coSo?: CoSoUpdateOneWithoutNguoiDungNestedInput
    buoiKhamTao?: BuoiKhamUpdateManyWithoutNguoiTaoRefNestedInput
    hoSoTuVan?: HoSoBenhNhanUpdateManyWithoutTuVanVienNestedInput
    hoSoChotCuoi?: HoSoBenhNhanUpdateManyWithoutNguoiChotCuoiNestedInput
    nhatKy?: NhatKyTheoDoiUpdateManyWithoutNguoiGoiNestedInput
  }

  export type NguoiDungCSRUncheckedUpdateWithoutHoSoPhuTrachInput = {
    maNV?: StringFieldUpdateOperationsInput | string
    hoTen?: StringFieldUpdateOperationsInput | string
    vaiTro?: StringFieldUpdateOperationsInput | string
    coSoId?: NullableStringFieldUpdateOperationsInput | string | null
    tenDangNhap?: StringFieldUpdateOperationsInput | string
    matKhauHash?: StringFieldUpdateOperationsInput | string
    trangThai?: StringFieldUpdateOperationsInput | string
    buoiKhamTao?: BuoiKhamUncheckedUpdateManyWithoutNguoiTaoRefNestedInput
    hoSoTuVan?: HoSoBenhNhanUncheckedUpdateManyWithoutTuVanVienNestedInput
    hoSoChotCuoi?: HoSoBenhNhanUncheckedUpdateManyWithoutNguoiChotCuoiNestedInput
    nhatKy?: NhatKyTheoDoiUncheckedUpdateManyWithoutNguoiGoiNestedInput
  }

  export type NguoiDungCSRUpsertWithoutHoSoChotCuoiInput = {
    update: XOR<NguoiDungCSRUpdateWithoutHoSoChotCuoiInput, NguoiDungCSRUncheckedUpdateWithoutHoSoChotCuoiInput>
    create: XOR<NguoiDungCSRCreateWithoutHoSoChotCuoiInput, NguoiDungCSRUncheckedCreateWithoutHoSoChotCuoiInput>
    where?: NguoiDungCSRWhereInput
  }

  export type NguoiDungCSRUpdateToOneWithWhereWithoutHoSoChotCuoiInput = {
    where?: NguoiDungCSRWhereInput
    data: XOR<NguoiDungCSRUpdateWithoutHoSoChotCuoiInput, NguoiDungCSRUncheckedUpdateWithoutHoSoChotCuoiInput>
  }

  export type NguoiDungCSRUpdateWithoutHoSoChotCuoiInput = {
    maNV?: StringFieldUpdateOperationsInput | string
    hoTen?: StringFieldUpdateOperationsInput | string
    vaiTro?: StringFieldUpdateOperationsInput | string
    tenDangNhap?: StringFieldUpdateOperationsInput | string
    matKhauHash?: StringFieldUpdateOperationsInput | string
    trangThai?: StringFieldUpdateOperationsInput | string
    coSo?: CoSoUpdateOneWithoutNguoiDungNestedInput
    buoiKhamTao?: BuoiKhamUpdateManyWithoutNguoiTaoRefNestedInput
    hoSoTuVan?: HoSoBenhNhanUpdateManyWithoutTuVanVienNestedInput
    hoSoPhuTrach?: HoSoBenhNhanUpdateManyWithoutNguoiPhuTrachNestedInput
    nhatKy?: NhatKyTheoDoiUpdateManyWithoutNguoiGoiNestedInput
  }

  export type NguoiDungCSRUncheckedUpdateWithoutHoSoChotCuoiInput = {
    maNV?: StringFieldUpdateOperationsInput | string
    hoTen?: StringFieldUpdateOperationsInput | string
    vaiTro?: StringFieldUpdateOperationsInput | string
    coSoId?: NullableStringFieldUpdateOperationsInput | string | null
    tenDangNhap?: StringFieldUpdateOperationsInput | string
    matKhauHash?: StringFieldUpdateOperationsInput | string
    trangThai?: StringFieldUpdateOperationsInput | string
    buoiKhamTao?: BuoiKhamUncheckedUpdateManyWithoutNguoiTaoRefNestedInput
    hoSoTuVan?: HoSoBenhNhanUncheckedUpdateManyWithoutTuVanVienNestedInput
    hoSoPhuTrach?: HoSoBenhNhanUncheckedUpdateManyWithoutNguoiPhuTrachNestedInput
    nhatKy?: NhatKyTheoDoiUncheckedUpdateManyWithoutNguoiGoiNestedInput
  }

  export type NhatKyTheoDoiUpsertWithWhereUniqueWithoutHoSoInput = {
    where: NhatKyTheoDoiWhereUniqueInput
    update: XOR<NhatKyTheoDoiUpdateWithoutHoSoInput, NhatKyTheoDoiUncheckedUpdateWithoutHoSoInput>
    create: XOR<NhatKyTheoDoiCreateWithoutHoSoInput, NhatKyTheoDoiUncheckedCreateWithoutHoSoInput>
  }

  export type NhatKyTheoDoiUpdateWithWhereUniqueWithoutHoSoInput = {
    where: NhatKyTheoDoiWhereUniqueInput
    data: XOR<NhatKyTheoDoiUpdateWithoutHoSoInput, NhatKyTheoDoiUncheckedUpdateWithoutHoSoInput>
  }

  export type NhatKyTheoDoiUpdateManyWithWhereWithoutHoSoInput = {
    where: NhatKyTheoDoiScalarWhereInput
    data: XOR<NhatKyTheoDoiUpdateManyMutationInput, NhatKyTheoDoiUncheckedUpdateManyWithoutHoSoInput>
  }

  export type HoSoBenhNhanCreateWithoutNhatKyInput = {
    id?: string
    maBN: string
    maBNHIS?: string | null
    stt: number
    hoTen: string
    gioiTinh: string
    ngaySinh?: Date | string | null
    namSinh: number
    cccd?: string | null
    diaChi?: string | null
    sdt?: string | null
    sdtNguoiNha?: string | null
    thiLucMP?: string | null
    thiLucMT?: string | null
    chanDoan?: string
    chanDoanKhac?: string | null
    khuyenNghi?: string | null
    bhyt?: string | null
    soTienBao?: number | null
    ngayDieuTri?: Date | string | null
    diemDon?: string | null
    gioDon?: string | null
    nhom?: string | null
    followUpStatus?: string | null
    ngayChot?: Date | string | null
    daDon?: boolean
    ngayMoThucTe?: Date | string | null
    soTienThucThu?: number | null
    trangThaiDieuTri?: string | null
    ngayTaiKham?: Date | string | null
    ghiChuMat2?: string | null
    trangThai?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    createdBy?: string | null
    updatedBy?: string | null
    syncStatus?: string
    buoiKham: BuoiKhamCreateNestedOneWithoutHoSoInput
    coSo: CoSoCreateNestedOneWithoutHoSoInput
    tuVanVien?: NguoiDungCSRCreateNestedOneWithoutHoSoTuVanInput
    nguoiPhuTrach?: NguoiDungCSRCreateNestedOneWithoutHoSoPhuTrachInput
    nguoiChotCuoi?: NguoiDungCSRCreateNestedOneWithoutHoSoChotCuoiInput
  }

  export type HoSoBenhNhanUncheckedCreateWithoutNhatKyInput = {
    id?: string
    maBN: string
    maBNHIS?: string | null
    stt: number
    buoiKhamId: string
    coSoId: string
    hoTen: string
    gioiTinh: string
    ngaySinh?: Date | string | null
    namSinh: number
    cccd?: string | null
    diaChi?: string | null
    sdt?: string | null
    sdtNguoiNha?: string | null
    thiLucMP?: string | null
    thiLucMT?: string | null
    chanDoan?: string
    chanDoanKhac?: string | null
    khuyenNghi?: string | null
    bhyt?: string | null
    tuVanVienMa?: string | null
    soTienBao?: number | null
    ngayDieuTri?: Date | string | null
    diemDon?: string | null
    gioDon?: string | null
    nhom?: string | null
    followUpStatus?: string | null
    nguoiPhuTrachMa?: string | null
    nguoiChotCuoiMa?: string | null
    ngayChot?: Date | string | null
    daDon?: boolean
    ngayMoThucTe?: Date | string | null
    soTienThucThu?: number | null
    trangThaiDieuTri?: string | null
    ngayTaiKham?: Date | string | null
    ghiChuMat2?: string | null
    trangThai?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    createdBy?: string | null
    updatedBy?: string | null
    syncStatus?: string
  }

  export type HoSoBenhNhanCreateOrConnectWithoutNhatKyInput = {
    where: HoSoBenhNhanWhereUniqueInput
    create: XOR<HoSoBenhNhanCreateWithoutNhatKyInput, HoSoBenhNhanUncheckedCreateWithoutNhatKyInput>
  }

  export type NguoiDungCSRCreateWithoutNhatKyInput = {
    maNV: string
    hoTen: string
    vaiTro: string
    tenDangNhap: string
    matKhauHash: string
    trangThai?: string
    coSo?: CoSoCreateNestedOneWithoutNguoiDungInput
    buoiKhamTao?: BuoiKhamCreateNestedManyWithoutNguoiTaoRefInput
    hoSoTuVan?: HoSoBenhNhanCreateNestedManyWithoutTuVanVienInput
    hoSoPhuTrach?: HoSoBenhNhanCreateNestedManyWithoutNguoiPhuTrachInput
    hoSoChotCuoi?: HoSoBenhNhanCreateNestedManyWithoutNguoiChotCuoiInput
  }

  export type NguoiDungCSRUncheckedCreateWithoutNhatKyInput = {
    maNV: string
    hoTen: string
    vaiTro: string
    coSoId?: string | null
    tenDangNhap: string
    matKhauHash: string
    trangThai?: string
    buoiKhamTao?: BuoiKhamUncheckedCreateNestedManyWithoutNguoiTaoRefInput
    hoSoTuVan?: HoSoBenhNhanUncheckedCreateNestedManyWithoutTuVanVienInput
    hoSoPhuTrach?: HoSoBenhNhanUncheckedCreateNestedManyWithoutNguoiPhuTrachInput
    hoSoChotCuoi?: HoSoBenhNhanUncheckedCreateNestedManyWithoutNguoiChotCuoiInput
  }

  export type NguoiDungCSRCreateOrConnectWithoutNhatKyInput = {
    where: NguoiDungCSRWhereUniqueInput
    create: XOR<NguoiDungCSRCreateWithoutNhatKyInput, NguoiDungCSRUncheckedCreateWithoutNhatKyInput>
  }

  export type HoSoBenhNhanUpsertWithoutNhatKyInput = {
    update: XOR<HoSoBenhNhanUpdateWithoutNhatKyInput, HoSoBenhNhanUncheckedUpdateWithoutNhatKyInput>
    create: XOR<HoSoBenhNhanCreateWithoutNhatKyInput, HoSoBenhNhanUncheckedCreateWithoutNhatKyInput>
    where?: HoSoBenhNhanWhereInput
  }

  export type HoSoBenhNhanUpdateToOneWithWhereWithoutNhatKyInput = {
    where?: HoSoBenhNhanWhereInput
    data: XOR<HoSoBenhNhanUpdateWithoutNhatKyInput, HoSoBenhNhanUncheckedUpdateWithoutNhatKyInput>
  }

  export type HoSoBenhNhanUpdateWithoutNhatKyInput = {
    id?: StringFieldUpdateOperationsInput | string
    maBN?: StringFieldUpdateOperationsInput | string
    maBNHIS?: NullableStringFieldUpdateOperationsInput | string | null
    stt?: IntFieldUpdateOperationsInput | number
    hoTen?: StringFieldUpdateOperationsInput | string
    gioiTinh?: StringFieldUpdateOperationsInput | string
    ngaySinh?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    namSinh?: IntFieldUpdateOperationsInput | number
    cccd?: NullableStringFieldUpdateOperationsInput | string | null
    diaChi?: NullableStringFieldUpdateOperationsInput | string | null
    sdt?: NullableStringFieldUpdateOperationsInput | string | null
    sdtNguoiNha?: NullableStringFieldUpdateOperationsInput | string | null
    thiLucMP?: NullableStringFieldUpdateOperationsInput | string | null
    thiLucMT?: NullableStringFieldUpdateOperationsInput | string | null
    chanDoan?: StringFieldUpdateOperationsInput | string
    chanDoanKhac?: NullableStringFieldUpdateOperationsInput | string | null
    khuyenNghi?: NullableStringFieldUpdateOperationsInput | string | null
    bhyt?: NullableStringFieldUpdateOperationsInput | string | null
    soTienBao?: NullableFloatFieldUpdateOperationsInput | number | null
    ngayDieuTri?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    diemDon?: NullableStringFieldUpdateOperationsInput | string | null
    gioDon?: NullableStringFieldUpdateOperationsInput | string | null
    nhom?: NullableStringFieldUpdateOperationsInput | string | null
    followUpStatus?: NullableStringFieldUpdateOperationsInput | string | null
    ngayChot?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    daDon?: BoolFieldUpdateOperationsInput | boolean
    ngayMoThucTe?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    soTienThucThu?: NullableFloatFieldUpdateOperationsInput | number | null
    trangThaiDieuTri?: NullableStringFieldUpdateOperationsInput | string | null
    ngayTaiKham?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    ghiChuMat2?: NullableStringFieldUpdateOperationsInput | string | null
    trangThai?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    updatedBy?: NullableStringFieldUpdateOperationsInput | string | null
    syncStatus?: StringFieldUpdateOperationsInput | string
    buoiKham?: BuoiKhamUpdateOneRequiredWithoutHoSoNestedInput
    coSo?: CoSoUpdateOneRequiredWithoutHoSoNestedInput
    tuVanVien?: NguoiDungCSRUpdateOneWithoutHoSoTuVanNestedInput
    nguoiPhuTrach?: NguoiDungCSRUpdateOneWithoutHoSoPhuTrachNestedInput
    nguoiChotCuoi?: NguoiDungCSRUpdateOneWithoutHoSoChotCuoiNestedInput
  }

  export type HoSoBenhNhanUncheckedUpdateWithoutNhatKyInput = {
    id?: StringFieldUpdateOperationsInput | string
    maBN?: StringFieldUpdateOperationsInput | string
    maBNHIS?: NullableStringFieldUpdateOperationsInput | string | null
    stt?: IntFieldUpdateOperationsInput | number
    buoiKhamId?: StringFieldUpdateOperationsInput | string
    coSoId?: StringFieldUpdateOperationsInput | string
    hoTen?: StringFieldUpdateOperationsInput | string
    gioiTinh?: StringFieldUpdateOperationsInput | string
    ngaySinh?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    namSinh?: IntFieldUpdateOperationsInput | number
    cccd?: NullableStringFieldUpdateOperationsInput | string | null
    diaChi?: NullableStringFieldUpdateOperationsInput | string | null
    sdt?: NullableStringFieldUpdateOperationsInput | string | null
    sdtNguoiNha?: NullableStringFieldUpdateOperationsInput | string | null
    thiLucMP?: NullableStringFieldUpdateOperationsInput | string | null
    thiLucMT?: NullableStringFieldUpdateOperationsInput | string | null
    chanDoan?: StringFieldUpdateOperationsInput | string
    chanDoanKhac?: NullableStringFieldUpdateOperationsInput | string | null
    khuyenNghi?: NullableStringFieldUpdateOperationsInput | string | null
    bhyt?: NullableStringFieldUpdateOperationsInput | string | null
    tuVanVienMa?: NullableStringFieldUpdateOperationsInput | string | null
    soTienBao?: NullableFloatFieldUpdateOperationsInput | number | null
    ngayDieuTri?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    diemDon?: NullableStringFieldUpdateOperationsInput | string | null
    gioDon?: NullableStringFieldUpdateOperationsInput | string | null
    nhom?: NullableStringFieldUpdateOperationsInput | string | null
    followUpStatus?: NullableStringFieldUpdateOperationsInput | string | null
    nguoiPhuTrachMa?: NullableStringFieldUpdateOperationsInput | string | null
    nguoiChotCuoiMa?: NullableStringFieldUpdateOperationsInput | string | null
    ngayChot?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    daDon?: BoolFieldUpdateOperationsInput | boolean
    ngayMoThucTe?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    soTienThucThu?: NullableFloatFieldUpdateOperationsInput | number | null
    trangThaiDieuTri?: NullableStringFieldUpdateOperationsInput | string | null
    ngayTaiKham?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    ghiChuMat2?: NullableStringFieldUpdateOperationsInput | string | null
    trangThai?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    updatedBy?: NullableStringFieldUpdateOperationsInput | string | null
    syncStatus?: StringFieldUpdateOperationsInput | string
  }

  export type NguoiDungCSRUpsertWithoutNhatKyInput = {
    update: XOR<NguoiDungCSRUpdateWithoutNhatKyInput, NguoiDungCSRUncheckedUpdateWithoutNhatKyInput>
    create: XOR<NguoiDungCSRCreateWithoutNhatKyInput, NguoiDungCSRUncheckedCreateWithoutNhatKyInput>
    where?: NguoiDungCSRWhereInput
  }

  export type NguoiDungCSRUpdateToOneWithWhereWithoutNhatKyInput = {
    where?: NguoiDungCSRWhereInput
    data: XOR<NguoiDungCSRUpdateWithoutNhatKyInput, NguoiDungCSRUncheckedUpdateWithoutNhatKyInput>
  }

  export type NguoiDungCSRUpdateWithoutNhatKyInput = {
    maNV?: StringFieldUpdateOperationsInput | string
    hoTen?: StringFieldUpdateOperationsInput | string
    vaiTro?: StringFieldUpdateOperationsInput | string
    tenDangNhap?: StringFieldUpdateOperationsInput | string
    matKhauHash?: StringFieldUpdateOperationsInput | string
    trangThai?: StringFieldUpdateOperationsInput | string
    coSo?: CoSoUpdateOneWithoutNguoiDungNestedInput
    buoiKhamTao?: BuoiKhamUpdateManyWithoutNguoiTaoRefNestedInput
    hoSoTuVan?: HoSoBenhNhanUpdateManyWithoutTuVanVienNestedInput
    hoSoPhuTrach?: HoSoBenhNhanUpdateManyWithoutNguoiPhuTrachNestedInput
    hoSoChotCuoi?: HoSoBenhNhanUpdateManyWithoutNguoiChotCuoiNestedInput
  }

  export type NguoiDungCSRUncheckedUpdateWithoutNhatKyInput = {
    maNV?: StringFieldUpdateOperationsInput | string
    hoTen?: StringFieldUpdateOperationsInput | string
    vaiTro?: StringFieldUpdateOperationsInput | string
    coSoId?: NullableStringFieldUpdateOperationsInput | string | null
    tenDangNhap?: StringFieldUpdateOperationsInput | string
    matKhauHash?: StringFieldUpdateOperationsInput | string
    trangThai?: StringFieldUpdateOperationsInput | string
    buoiKhamTao?: BuoiKhamUncheckedUpdateManyWithoutNguoiTaoRefNestedInput
    hoSoTuVan?: HoSoBenhNhanUncheckedUpdateManyWithoutTuVanVienNestedInput
    hoSoPhuTrach?: HoSoBenhNhanUncheckedUpdateManyWithoutNguoiPhuTrachNestedInput
    hoSoChotCuoi?: HoSoBenhNhanUncheckedUpdateManyWithoutNguoiChotCuoiNestedInput
  }

  export type BuoiKhamCreateManyCoSoInput = {
    id?: string
    ngayKham: Date | string
    xa: string
    diaDiem: string
    ghiChu?: string | null
    nguoiTao: string
    createdAt?: Date | string
    syncStatus?: string
  }

  export type NguoiDungCSRCreateManyCoSoInput = {
    maNV: string
    hoTen: string
    vaiTro: string
    tenDangNhap: string
    matKhauHash: string
    trangThai?: string
  }

  export type HoSoBenhNhanCreateManyCoSoInput = {
    id?: string
    maBN: string
    maBNHIS?: string | null
    stt: number
    buoiKhamId: string
    hoTen: string
    gioiTinh: string
    ngaySinh?: Date | string | null
    namSinh: number
    cccd?: string | null
    diaChi?: string | null
    sdt?: string | null
    sdtNguoiNha?: string | null
    thiLucMP?: string | null
    thiLucMT?: string | null
    chanDoan?: string
    chanDoanKhac?: string | null
    khuyenNghi?: string | null
    bhyt?: string | null
    tuVanVienMa?: string | null
    soTienBao?: number | null
    ngayDieuTri?: Date | string | null
    diemDon?: string | null
    gioDon?: string | null
    nhom?: string | null
    followUpStatus?: string | null
    nguoiPhuTrachMa?: string | null
    nguoiChotCuoiMa?: string | null
    ngayChot?: Date | string | null
    daDon?: boolean
    ngayMoThucTe?: Date | string | null
    soTienThucThu?: number | null
    trangThaiDieuTri?: string | null
    ngayTaiKham?: Date | string | null
    ghiChuMat2?: string | null
    trangThai?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    createdBy?: string | null
    updatedBy?: string | null
    syncStatus?: string
  }

  export type BuoiKhamUpdateWithoutCoSoInput = {
    id?: StringFieldUpdateOperationsInput | string
    ngayKham?: DateTimeFieldUpdateOperationsInput | Date | string
    xa?: StringFieldUpdateOperationsInput | string
    diaDiem?: StringFieldUpdateOperationsInput | string
    ghiChu?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    syncStatus?: StringFieldUpdateOperationsInput | string
    nguoiTaoRef?: NguoiDungCSRUpdateOneRequiredWithoutBuoiKhamTaoNestedInput
    hoSo?: HoSoBenhNhanUpdateManyWithoutBuoiKhamNestedInput
  }

  export type BuoiKhamUncheckedUpdateWithoutCoSoInput = {
    id?: StringFieldUpdateOperationsInput | string
    ngayKham?: DateTimeFieldUpdateOperationsInput | Date | string
    xa?: StringFieldUpdateOperationsInput | string
    diaDiem?: StringFieldUpdateOperationsInput | string
    ghiChu?: NullableStringFieldUpdateOperationsInput | string | null
    nguoiTao?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    syncStatus?: StringFieldUpdateOperationsInput | string
    hoSo?: HoSoBenhNhanUncheckedUpdateManyWithoutBuoiKhamNestedInput
  }

  export type BuoiKhamUncheckedUpdateManyWithoutCoSoInput = {
    id?: StringFieldUpdateOperationsInput | string
    ngayKham?: DateTimeFieldUpdateOperationsInput | Date | string
    xa?: StringFieldUpdateOperationsInput | string
    diaDiem?: StringFieldUpdateOperationsInput | string
    ghiChu?: NullableStringFieldUpdateOperationsInput | string | null
    nguoiTao?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    syncStatus?: StringFieldUpdateOperationsInput | string
  }

  export type NguoiDungCSRUpdateWithoutCoSoInput = {
    maNV?: StringFieldUpdateOperationsInput | string
    hoTen?: StringFieldUpdateOperationsInput | string
    vaiTro?: StringFieldUpdateOperationsInput | string
    tenDangNhap?: StringFieldUpdateOperationsInput | string
    matKhauHash?: StringFieldUpdateOperationsInput | string
    trangThai?: StringFieldUpdateOperationsInput | string
    buoiKhamTao?: BuoiKhamUpdateManyWithoutNguoiTaoRefNestedInput
    hoSoTuVan?: HoSoBenhNhanUpdateManyWithoutTuVanVienNestedInput
    hoSoPhuTrach?: HoSoBenhNhanUpdateManyWithoutNguoiPhuTrachNestedInput
    hoSoChotCuoi?: HoSoBenhNhanUpdateManyWithoutNguoiChotCuoiNestedInput
    nhatKy?: NhatKyTheoDoiUpdateManyWithoutNguoiGoiNestedInput
  }

  export type NguoiDungCSRUncheckedUpdateWithoutCoSoInput = {
    maNV?: StringFieldUpdateOperationsInput | string
    hoTen?: StringFieldUpdateOperationsInput | string
    vaiTro?: StringFieldUpdateOperationsInput | string
    tenDangNhap?: StringFieldUpdateOperationsInput | string
    matKhauHash?: StringFieldUpdateOperationsInput | string
    trangThai?: StringFieldUpdateOperationsInput | string
    buoiKhamTao?: BuoiKhamUncheckedUpdateManyWithoutNguoiTaoRefNestedInput
    hoSoTuVan?: HoSoBenhNhanUncheckedUpdateManyWithoutTuVanVienNestedInput
    hoSoPhuTrach?: HoSoBenhNhanUncheckedUpdateManyWithoutNguoiPhuTrachNestedInput
    hoSoChotCuoi?: HoSoBenhNhanUncheckedUpdateManyWithoutNguoiChotCuoiNestedInput
    nhatKy?: NhatKyTheoDoiUncheckedUpdateManyWithoutNguoiGoiNestedInput
  }

  export type NguoiDungCSRUncheckedUpdateManyWithoutCoSoInput = {
    maNV?: StringFieldUpdateOperationsInput | string
    hoTen?: StringFieldUpdateOperationsInput | string
    vaiTro?: StringFieldUpdateOperationsInput | string
    tenDangNhap?: StringFieldUpdateOperationsInput | string
    matKhauHash?: StringFieldUpdateOperationsInput | string
    trangThai?: StringFieldUpdateOperationsInput | string
  }

  export type HoSoBenhNhanUpdateWithoutCoSoInput = {
    id?: StringFieldUpdateOperationsInput | string
    maBN?: StringFieldUpdateOperationsInput | string
    maBNHIS?: NullableStringFieldUpdateOperationsInput | string | null
    stt?: IntFieldUpdateOperationsInput | number
    hoTen?: StringFieldUpdateOperationsInput | string
    gioiTinh?: StringFieldUpdateOperationsInput | string
    ngaySinh?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    namSinh?: IntFieldUpdateOperationsInput | number
    cccd?: NullableStringFieldUpdateOperationsInput | string | null
    diaChi?: NullableStringFieldUpdateOperationsInput | string | null
    sdt?: NullableStringFieldUpdateOperationsInput | string | null
    sdtNguoiNha?: NullableStringFieldUpdateOperationsInput | string | null
    thiLucMP?: NullableStringFieldUpdateOperationsInput | string | null
    thiLucMT?: NullableStringFieldUpdateOperationsInput | string | null
    chanDoan?: StringFieldUpdateOperationsInput | string
    chanDoanKhac?: NullableStringFieldUpdateOperationsInput | string | null
    khuyenNghi?: NullableStringFieldUpdateOperationsInput | string | null
    bhyt?: NullableStringFieldUpdateOperationsInput | string | null
    soTienBao?: NullableFloatFieldUpdateOperationsInput | number | null
    ngayDieuTri?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    diemDon?: NullableStringFieldUpdateOperationsInput | string | null
    gioDon?: NullableStringFieldUpdateOperationsInput | string | null
    nhom?: NullableStringFieldUpdateOperationsInput | string | null
    followUpStatus?: NullableStringFieldUpdateOperationsInput | string | null
    ngayChot?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    daDon?: BoolFieldUpdateOperationsInput | boolean
    ngayMoThucTe?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    soTienThucThu?: NullableFloatFieldUpdateOperationsInput | number | null
    trangThaiDieuTri?: NullableStringFieldUpdateOperationsInput | string | null
    ngayTaiKham?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    ghiChuMat2?: NullableStringFieldUpdateOperationsInput | string | null
    trangThai?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    updatedBy?: NullableStringFieldUpdateOperationsInput | string | null
    syncStatus?: StringFieldUpdateOperationsInput | string
    buoiKham?: BuoiKhamUpdateOneRequiredWithoutHoSoNestedInput
    tuVanVien?: NguoiDungCSRUpdateOneWithoutHoSoTuVanNestedInput
    nguoiPhuTrach?: NguoiDungCSRUpdateOneWithoutHoSoPhuTrachNestedInput
    nguoiChotCuoi?: NguoiDungCSRUpdateOneWithoutHoSoChotCuoiNestedInput
    nhatKy?: NhatKyTheoDoiUpdateManyWithoutHoSoNestedInput
  }

  export type HoSoBenhNhanUncheckedUpdateWithoutCoSoInput = {
    id?: StringFieldUpdateOperationsInput | string
    maBN?: StringFieldUpdateOperationsInput | string
    maBNHIS?: NullableStringFieldUpdateOperationsInput | string | null
    stt?: IntFieldUpdateOperationsInput | number
    buoiKhamId?: StringFieldUpdateOperationsInput | string
    hoTen?: StringFieldUpdateOperationsInput | string
    gioiTinh?: StringFieldUpdateOperationsInput | string
    ngaySinh?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    namSinh?: IntFieldUpdateOperationsInput | number
    cccd?: NullableStringFieldUpdateOperationsInput | string | null
    diaChi?: NullableStringFieldUpdateOperationsInput | string | null
    sdt?: NullableStringFieldUpdateOperationsInput | string | null
    sdtNguoiNha?: NullableStringFieldUpdateOperationsInput | string | null
    thiLucMP?: NullableStringFieldUpdateOperationsInput | string | null
    thiLucMT?: NullableStringFieldUpdateOperationsInput | string | null
    chanDoan?: StringFieldUpdateOperationsInput | string
    chanDoanKhac?: NullableStringFieldUpdateOperationsInput | string | null
    khuyenNghi?: NullableStringFieldUpdateOperationsInput | string | null
    bhyt?: NullableStringFieldUpdateOperationsInput | string | null
    tuVanVienMa?: NullableStringFieldUpdateOperationsInput | string | null
    soTienBao?: NullableFloatFieldUpdateOperationsInput | number | null
    ngayDieuTri?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    diemDon?: NullableStringFieldUpdateOperationsInput | string | null
    gioDon?: NullableStringFieldUpdateOperationsInput | string | null
    nhom?: NullableStringFieldUpdateOperationsInput | string | null
    followUpStatus?: NullableStringFieldUpdateOperationsInput | string | null
    nguoiPhuTrachMa?: NullableStringFieldUpdateOperationsInput | string | null
    nguoiChotCuoiMa?: NullableStringFieldUpdateOperationsInput | string | null
    ngayChot?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    daDon?: BoolFieldUpdateOperationsInput | boolean
    ngayMoThucTe?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    soTienThucThu?: NullableFloatFieldUpdateOperationsInput | number | null
    trangThaiDieuTri?: NullableStringFieldUpdateOperationsInput | string | null
    ngayTaiKham?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    ghiChuMat2?: NullableStringFieldUpdateOperationsInput | string | null
    trangThai?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    updatedBy?: NullableStringFieldUpdateOperationsInput | string | null
    syncStatus?: StringFieldUpdateOperationsInput | string
    nhatKy?: NhatKyTheoDoiUncheckedUpdateManyWithoutHoSoNestedInput
  }

  export type HoSoBenhNhanUncheckedUpdateManyWithoutCoSoInput = {
    id?: StringFieldUpdateOperationsInput | string
    maBN?: StringFieldUpdateOperationsInput | string
    maBNHIS?: NullableStringFieldUpdateOperationsInput | string | null
    stt?: IntFieldUpdateOperationsInput | number
    buoiKhamId?: StringFieldUpdateOperationsInput | string
    hoTen?: StringFieldUpdateOperationsInput | string
    gioiTinh?: StringFieldUpdateOperationsInput | string
    ngaySinh?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    namSinh?: IntFieldUpdateOperationsInput | number
    cccd?: NullableStringFieldUpdateOperationsInput | string | null
    diaChi?: NullableStringFieldUpdateOperationsInput | string | null
    sdt?: NullableStringFieldUpdateOperationsInput | string | null
    sdtNguoiNha?: NullableStringFieldUpdateOperationsInput | string | null
    thiLucMP?: NullableStringFieldUpdateOperationsInput | string | null
    thiLucMT?: NullableStringFieldUpdateOperationsInput | string | null
    chanDoan?: StringFieldUpdateOperationsInput | string
    chanDoanKhac?: NullableStringFieldUpdateOperationsInput | string | null
    khuyenNghi?: NullableStringFieldUpdateOperationsInput | string | null
    bhyt?: NullableStringFieldUpdateOperationsInput | string | null
    tuVanVienMa?: NullableStringFieldUpdateOperationsInput | string | null
    soTienBao?: NullableFloatFieldUpdateOperationsInput | number | null
    ngayDieuTri?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    diemDon?: NullableStringFieldUpdateOperationsInput | string | null
    gioDon?: NullableStringFieldUpdateOperationsInput | string | null
    nhom?: NullableStringFieldUpdateOperationsInput | string | null
    followUpStatus?: NullableStringFieldUpdateOperationsInput | string | null
    nguoiPhuTrachMa?: NullableStringFieldUpdateOperationsInput | string | null
    nguoiChotCuoiMa?: NullableStringFieldUpdateOperationsInput | string | null
    ngayChot?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    daDon?: BoolFieldUpdateOperationsInput | boolean
    ngayMoThucTe?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    soTienThucThu?: NullableFloatFieldUpdateOperationsInput | number | null
    trangThaiDieuTri?: NullableStringFieldUpdateOperationsInput | string | null
    ngayTaiKham?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    ghiChuMat2?: NullableStringFieldUpdateOperationsInput | string | null
    trangThai?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    updatedBy?: NullableStringFieldUpdateOperationsInput | string | null
    syncStatus?: StringFieldUpdateOperationsInput | string
  }

  export type BuoiKhamCreateManyNguoiTaoRefInput = {
    id?: string
    coSoId: string
    ngayKham: Date | string
    xa: string
    diaDiem: string
    ghiChu?: string | null
    createdAt?: Date | string
    syncStatus?: string
  }

  export type HoSoBenhNhanCreateManyTuVanVienInput = {
    id?: string
    maBN: string
    maBNHIS?: string | null
    stt: number
    buoiKhamId: string
    coSoId: string
    hoTen: string
    gioiTinh: string
    ngaySinh?: Date | string | null
    namSinh: number
    cccd?: string | null
    diaChi?: string | null
    sdt?: string | null
    sdtNguoiNha?: string | null
    thiLucMP?: string | null
    thiLucMT?: string | null
    chanDoan?: string
    chanDoanKhac?: string | null
    khuyenNghi?: string | null
    bhyt?: string | null
    soTienBao?: number | null
    ngayDieuTri?: Date | string | null
    diemDon?: string | null
    gioDon?: string | null
    nhom?: string | null
    followUpStatus?: string | null
    nguoiPhuTrachMa?: string | null
    nguoiChotCuoiMa?: string | null
    ngayChot?: Date | string | null
    daDon?: boolean
    ngayMoThucTe?: Date | string | null
    soTienThucThu?: number | null
    trangThaiDieuTri?: string | null
    ngayTaiKham?: Date | string | null
    ghiChuMat2?: string | null
    trangThai?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    createdBy?: string | null
    updatedBy?: string | null
    syncStatus?: string
  }

  export type HoSoBenhNhanCreateManyNguoiPhuTrachInput = {
    id?: string
    maBN: string
    maBNHIS?: string | null
    stt: number
    buoiKhamId: string
    coSoId: string
    hoTen: string
    gioiTinh: string
    ngaySinh?: Date | string | null
    namSinh: number
    cccd?: string | null
    diaChi?: string | null
    sdt?: string | null
    sdtNguoiNha?: string | null
    thiLucMP?: string | null
    thiLucMT?: string | null
    chanDoan?: string
    chanDoanKhac?: string | null
    khuyenNghi?: string | null
    bhyt?: string | null
    tuVanVienMa?: string | null
    soTienBao?: number | null
    ngayDieuTri?: Date | string | null
    diemDon?: string | null
    gioDon?: string | null
    nhom?: string | null
    followUpStatus?: string | null
    nguoiChotCuoiMa?: string | null
    ngayChot?: Date | string | null
    daDon?: boolean
    ngayMoThucTe?: Date | string | null
    soTienThucThu?: number | null
    trangThaiDieuTri?: string | null
    ngayTaiKham?: Date | string | null
    ghiChuMat2?: string | null
    trangThai?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    createdBy?: string | null
    updatedBy?: string | null
    syncStatus?: string
  }

  export type HoSoBenhNhanCreateManyNguoiChotCuoiInput = {
    id?: string
    maBN: string
    maBNHIS?: string | null
    stt: number
    buoiKhamId: string
    coSoId: string
    hoTen: string
    gioiTinh: string
    ngaySinh?: Date | string | null
    namSinh: number
    cccd?: string | null
    diaChi?: string | null
    sdt?: string | null
    sdtNguoiNha?: string | null
    thiLucMP?: string | null
    thiLucMT?: string | null
    chanDoan?: string
    chanDoanKhac?: string | null
    khuyenNghi?: string | null
    bhyt?: string | null
    tuVanVienMa?: string | null
    soTienBao?: number | null
    ngayDieuTri?: Date | string | null
    diemDon?: string | null
    gioDon?: string | null
    nhom?: string | null
    followUpStatus?: string | null
    nguoiPhuTrachMa?: string | null
    ngayChot?: Date | string | null
    daDon?: boolean
    ngayMoThucTe?: Date | string | null
    soTienThucThu?: number | null
    trangThaiDieuTri?: string | null
    ngayTaiKham?: Date | string | null
    ghiChuMat2?: string | null
    trangThai?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    createdBy?: string | null
    updatedBy?: string | null
    syncStatus?: string
  }

  export type NhatKyTheoDoiCreateManyNguoiGoiInput = {
    id?: string
    hoSoId: string
    ngay: Date | string
    noiDung: string
    syncStatus?: string
  }

  export type BuoiKhamUpdateWithoutNguoiTaoRefInput = {
    id?: StringFieldUpdateOperationsInput | string
    ngayKham?: DateTimeFieldUpdateOperationsInput | Date | string
    xa?: StringFieldUpdateOperationsInput | string
    diaDiem?: StringFieldUpdateOperationsInput | string
    ghiChu?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    syncStatus?: StringFieldUpdateOperationsInput | string
    coSo?: CoSoUpdateOneRequiredWithoutBuoiKhamNestedInput
    hoSo?: HoSoBenhNhanUpdateManyWithoutBuoiKhamNestedInput
  }

  export type BuoiKhamUncheckedUpdateWithoutNguoiTaoRefInput = {
    id?: StringFieldUpdateOperationsInput | string
    coSoId?: StringFieldUpdateOperationsInput | string
    ngayKham?: DateTimeFieldUpdateOperationsInput | Date | string
    xa?: StringFieldUpdateOperationsInput | string
    diaDiem?: StringFieldUpdateOperationsInput | string
    ghiChu?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    syncStatus?: StringFieldUpdateOperationsInput | string
    hoSo?: HoSoBenhNhanUncheckedUpdateManyWithoutBuoiKhamNestedInput
  }

  export type BuoiKhamUncheckedUpdateManyWithoutNguoiTaoRefInput = {
    id?: StringFieldUpdateOperationsInput | string
    coSoId?: StringFieldUpdateOperationsInput | string
    ngayKham?: DateTimeFieldUpdateOperationsInput | Date | string
    xa?: StringFieldUpdateOperationsInput | string
    diaDiem?: StringFieldUpdateOperationsInput | string
    ghiChu?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    syncStatus?: StringFieldUpdateOperationsInput | string
  }

  export type HoSoBenhNhanUpdateWithoutTuVanVienInput = {
    id?: StringFieldUpdateOperationsInput | string
    maBN?: StringFieldUpdateOperationsInput | string
    maBNHIS?: NullableStringFieldUpdateOperationsInput | string | null
    stt?: IntFieldUpdateOperationsInput | number
    hoTen?: StringFieldUpdateOperationsInput | string
    gioiTinh?: StringFieldUpdateOperationsInput | string
    ngaySinh?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    namSinh?: IntFieldUpdateOperationsInput | number
    cccd?: NullableStringFieldUpdateOperationsInput | string | null
    diaChi?: NullableStringFieldUpdateOperationsInput | string | null
    sdt?: NullableStringFieldUpdateOperationsInput | string | null
    sdtNguoiNha?: NullableStringFieldUpdateOperationsInput | string | null
    thiLucMP?: NullableStringFieldUpdateOperationsInput | string | null
    thiLucMT?: NullableStringFieldUpdateOperationsInput | string | null
    chanDoan?: StringFieldUpdateOperationsInput | string
    chanDoanKhac?: NullableStringFieldUpdateOperationsInput | string | null
    khuyenNghi?: NullableStringFieldUpdateOperationsInput | string | null
    bhyt?: NullableStringFieldUpdateOperationsInput | string | null
    soTienBao?: NullableFloatFieldUpdateOperationsInput | number | null
    ngayDieuTri?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    diemDon?: NullableStringFieldUpdateOperationsInput | string | null
    gioDon?: NullableStringFieldUpdateOperationsInput | string | null
    nhom?: NullableStringFieldUpdateOperationsInput | string | null
    followUpStatus?: NullableStringFieldUpdateOperationsInput | string | null
    ngayChot?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    daDon?: BoolFieldUpdateOperationsInput | boolean
    ngayMoThucTe?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    soTienThucThu?: NullableFloatFieldUpdateOperationsInput | number | null
    trangThaiDieuTri?: NullableStringFieldUpdateOperationsInput | string | null
    ngayTaiKham?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    ghiChuMat2?: NullableStringFieldUpdateOperationsInput | string | null
    trangThai?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    updatedBy?: NullableStringFieldUpdateOperationsInput | string | null
    syncStatus?: StringFieldUpdateOperationsInput | string
    buoiKham?: BuoiKhamUpdateOneRequiredWithoutHoSoNestedInput
    coSo?: CoSoUpdateOneRequiredWithoutHoSoNestedInput
    nguoiPhuTrach?: NguoiDungCSRUpdateOneWithoutHoSoPhuTrachNestedInput
    nguoiChotCuoi?: NguoiDungCSRUpdateOneWithoutHoSoChotCuoiNestedInput
    nhatKy?: NhatKyTheoDoiUpdateManyWithoutHoSoNestedInput
  }

  export type HoSoBenhNhanUncheckedUpdateWithoutTuVanVienInput = {
    id?: StringFieldUpdateOperationsInput | string
    maBN?: StringFieldUpdateOperationsInput | string
    maBNHIS?: NullableStringFieldUpdateOperationsInput | string | null
    stt?: IntFieldUpdateOperationsInput | number
    buoiKhamId?: StringFieldUpdateOperationsInput | string
    coSoId?: StringFieldUpdateOperationsInput | string
    hoTen?: StringFieldUpdateOperationsInput | string
    gioiTinh?: StringFieldUpdateOperationsInput | string
    ngaySinh?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    namSinh?: IntFieldUpdateOperationsInput | number
    cccd?: NullableStringFieldUpdateOperationsInput | string | null
    diaChi?: NullableStringFieldUpdateOperationsInput | string | null
    sdt?: NullableStringFieldUpdateOperationsInput | string | null
    sdtNguoiNha?: NullableStringFieldUpdateOperationsInput | string | null
    thiLucMP?: NullableStringFieldUpdateOperationsInput | string | null
    thiLucMT?: NullableStringFieldUpdateOperationsInput | string | null
    chanDoan?: StringFieldUpdateOperationsInput | string
    chanDoanKhac?: NullableStringFieldUpdateOperationsInput | string | null
    khuyenNghi?: NullableStringFieldUpdateOperationsInput | string | null
    bhyt?: NullableStringFieldUpdateOperationsInput | string | null
    soTienBao?: NullableFloatFieldUpdateOperationsInput | number | null
    ngayDieuTri?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    diemDon?: NullableStringFieldUpdateOperationsInput | string | null
    gioDon?: NullableStringFieldUpdateOperationsInput | string | null
    nhom?: NullableStringFieldUpdateOperationsInput | string | null
    followUpStatus?: NullableStringFieldUpdateOperationsInput | string | null
    nguoiPhuTrachMa?: NullableStringFieldUpdateOperationsInput | string | null
    nguoiChotCuoiMa?: NullableStringFieldUpdateOperationsInput | string | null
    ngayChot?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    daDon?: BoolFieldUpdateOperationsInput | boolean
    ngayMoThucTe?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    soTienThucThu?: NullableFloatFieldUpdateOperationsInput | number | null
    trangThaiDieuTri?: NullableStringFieldUpdateOperationsInput | string | null
    ngayTaiKham?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    ghiChuMat2?: NullableStringFieldUpdateOperationsInput | string | null
    trangThai?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    updatedBy?: NullableStringFieldUpdateOperationsInput | string | null
    syncStatus?: StringFieldUpdateOperationsInput | string
    nhatKy?: NhatKyTheoDoiUncheckedUpdateManyWithoutHoSoNestedInput
  }

  export type HoSoBenhNhanUncheckedUpdateManyWithoutTuVanVienInput = {
    id?: StringFieldUpdateOperationsInput | string
    maBN?: StringFieldUpdateOperationsInput | string
    maBNHIS?: NullableStringFieldUpdateOperationsInput | string | null
    stt?: IntFieldUpdateOperationsInput | number
    buoiKhamId?: StringFieldUpdateOperationsInput | string
    coSoId?: StringFieldUpdateOperationsInput | string
    hoTen?: StringFieldUpdateOperationsInput | string
    gioiTinh?: StringFieldUpdateOperationsInput | string
    ngaySinh?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    namSinh?: IntFieldUpdateOperationsInput | number
    cccd?: NullableStringFieldUpdateOperationsInput | string | null
    diaChi?: NullableStringFieldUpdateOperationsInput | string | null
    sdt?: NullableStringFieldUpdateOperationsInput | string | null
    sdtNguoiNha?: NullableStringFieldUpdateOperationsInput | string | null
    thiLucMP?: NullableStringFieldUpdateOperationsInput | string | null
    thiLucMT?: NullableStringFieldUpdateOperationsInput | string | null
    chanDoan?: StringFieldUpdateOperationsInput | string
    chanDoanKhac?: NullableStringFieldUpdateOperationsInput | string | null
    khuyenNghi?: NullableStringFieldUpdateOperationsInput | string | null
    bhyt?: NullableStringFieldUpdateOperationsInput | string | null
    soTienBao?: NullableFloatFieldUpdateOperationsInput | number | null
    ngayDieuTri?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    diemDon?: NullableStringFieldUpdateOperationsInput | string | null
    gioDon?: NullableStringFieldUpdateOperationsInput | string | null
    nhom?: NullableStringFieldUpdateOperationsInput | string | null
    followUpStatus?: NullableStringFieldUpdateOperationsInput | string | null
    nguoiPhuTrachMa?: NullableStringFieldUpdateOperationsInput | string | null
    nguoiChotCuoiMa?: NullableStringFieldUpdateOperationsInput | string | null
    ngayChot?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    daDon?: BoolFieldUpdateOperationsInput | boolean
    ngayMoThucTe?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    soTienThucThu?: NullableFloatFieldUpdateOperationsInput | number | null
    trangThaiDieuTri?: NullableStringFieldUpdateOperationsInput | string | null
    ngayTaiKham?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    ghiChuMat2?: NullableStringFieldUpdateOperationsInput | string | null
    trangThai?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    updatedBy?: NullableStringFieldUpdateOperationsInput | string | null
    syncStatus?: StringFieldUpdateOperationsInput | string
  }

  export type HoSoBenhNhanUpdateWithoutNguoiPhuTrachInput = {
    id?: StringFieldUpdateOperationsInput | string
    maBN?: StringFieldUpdateOperationsInput | string
    maBNHIS?: NullableStringFieldUpdateOperationsInput | string | null
    stt?: IntFieldUpdateOperationsInput | number
    hoTen?: StringFieldUpdateOperationsInput | string
    gioiTinh?: StringFieldUpdateOperationsInput | string
    ngaySinh?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    namSinh?: IntFieldUpdateOperationsInput | number
    cccd?: NullableStringFieldUpdateOperationsInput | string | null
    diaChi?: NullableStringFieldUpdateOperationsInput | string | null
    sdt?: NullableStringFieldUpdateOperationsInput | string | null
    sdtNguoiNha?: NullableStringFieldUpdateOperationsInput | string | null
    thiLucMP?: NullableStringFieldUpdateOperationsInput | string | null
    thiLucMT?: NullableStringFieldUpdateOperationsInput | string | null
    chanDoan?: StringFieldUpdateOperationsInput | string
    chanDoanKhac?: NullableStringFieldUpdateOperationsInput | string | null
    khuyenNghi?: NullableStringFieldUpdateOperationsInput | string | null
    bhyt?: NullableStringFieldUpdateOperationsInput | string | null
    soTienBao?: NullableFloatFieldUpdateOperationsInput | number | null
    ngayDieuTri?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    diemDon?: NullableStringFieldUpdateOperationsInput | string | null
    gioDon?: NullableStringFieldUpdateOperationsInput | string | null
    nhom?: NullableStringFieldUpdateOperationsInput | string | null
    followUpStatus?: NullableStringFieldUpdateOperationsInput | string | null
    ngayChot?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    daDon?: BoolFieldUpdateOperationsInput | boolean
    ngayMoThucTe?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    soTienThucThu?: NullableFloatFieldUpdateOperationsInput | number | null
    trangThaiDieuTri?: NullableStringFieldUpdateOperationsInput | string | null
    ngayTaiKham?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    ghiChuMat2?: NullableStringFieldUpdateOperationsInput | string | null
    trangThai?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    updatedBy?: NullableStringFieldUpdateOperationsInput | string | null
    syncStatus?: StringFieldUpdateOperationsInput | string
    buoiKham?: BuoiKhamUpdateOneRequiredWithoutHoSoNestedInput
    coSo?: CoSoUpdateOneRequiredWithoutHoSoNestedInput
    tuVanVien?: NguoiDungCSRUpdateOneWithoutHoSoTuVanNestedInput
    nguoiChotCuoi?: NguoiDungCSRUpdateOneWithoutHoSoChotCuoiNestedInput
    nhatKy?: NhatKyTheoDoiUpdateManyWithoutHoSoNestedInput
  }

  export type HoSoBenhNhanUncheckedUpdateWithoutNguoiPhuTrachInput = {
    id?: StringFieldUpdateOperationsInput | string
    maBN?: StringFieldUpdateOperationsInput | string
    maBNHIS?: NullableStringFieldUpdateOperationsInput | string | null
    stt?: IntFieldUpdateOperationsInput | number
    buoiKhamId?: StringFieldUpdateOperationsInput | string
    coSoId?: StringFieldUpdateOperationsInput | string
    hoTen?: StringFieldUpdateOperationsInput | string
    gioiTinh?: StringFieldUpdateOperationsInput | string
    ngaySinh?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    namSinh?: IntFieldUpdateOperationsInput | number
    cccd?: NullableStringFieldUpdateOperationsInput | string | null
    diaChi?: NullableStringFieldUpdateOperationsInput | string | null
    sdt?: NullableStringFieldUpdateOperationsInput | string | null
    sdtNguoiNha?: NullableStringFieldUpdateOperationsInput | string | null
    thiLucMP?: NullableStringFieldUpdateOperationsInput | string | null
    thiLucMT?: NullableStringFieldUpdateOperationsInput | string | null
    chanDoan?: StringFieldUpdateOperationsInput | string
    chanDoanKhac?: NullableStringFieldUpdateOperationsInput | string | null
    khuyenNghi?: NullableStringFieldUpdateOperationsInput | string | null
    bhyt?: NullableStringFieldUpdateOperationsInput | string | null
    tuVanVienMa?: NullableStringFieldUpdateOperationsInput | string | null
    soTienBao?: NullableFloatFieldUpdateOperationsInput | number | null
    ngayDieuTri?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    diemDon?: NullableStringFieldUpdateOperationsInput | string | null
    gioDon?: NullableStringFieldUpdateOperationsInput | string | null
    nhom?: NullableStringFieldUpdateOperationsInput | string | null
    followUpStatus?: NullableStringFieldUpdateOperationsInput | string | null
    nguoiChotCuoiMa?: NullableStringFieldUpdateOperationsInput | string | null
    ngayChot?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    daDon?: BoolFieldUpdateOperationsInput | boolean
    ngayMoThucTe?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    soTienThucThu?: NullableFloatFieldUpdateOperationsInput | number | null
    trangThaiDieuTri?: NullableStringFieldUpdateOperationsInput | string | null
    ngayTaiKham?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    ghiChuMat2?: NullableStringFieldUpdateOperationsInput | string | null
    trangThai?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    updatedBy?: NullableStringFieldUpdateOperationsInput | string | null
    syncStatus?: StringFieldUpdateOperationsInput | string
    nhatKy?: NhatKyTheoDoiUncheckedUpdateManyWithoutHoSoNestedInput
  }

  export type HoSoBenhNhanUncheckedUpdateManyWithoutNguoiPhuTrachInput = {
    id?: StringFieldUpdateOperationsInput | string
    maBN?: StringFieldUpdateOperationsInput | string
    maBNHIS?: NullableStringFieldUpdateOperationsInput | string | null
    stt?: IntFieldUpdateOperationsInput | number
    buoiKhamId?: StringFieldUpdateOperationsInput | string
    coSoId?: StringFieldUpdateOperationsInput | string
    hoTen?: StringFieldUpdateOperationsInput | string
    gioiTinh?: StringFieldUpdateOperationsInput | string
    ngaySinh?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    namSinh?: IntFieldUpdateOperationsInput | number
    cccd?: NullableStringFieldUpdateOperationsInput | string | null
    diaChi?: NullableStringFieldUpdateOperationsInput | string | null
    sdt?: NullableStringFieldUpdateOperationsInput | string | null
    sdtNguoiNha?: NullableStringFieldUpdateOperationsInput | string | null
    thiLucMP?: NullableStringFieldUpdateOperationsInput | string | null
    thiLucMT?: NullableStringFieldUpdateOperationsInput | string | null
    chanDoan?: StringFieldUpdateOperationsInput | string
    chanDoanKhac?: NullableStringFieldUpdateOperationsInput | string | null
    khuyenNghi?: NullableStringFieldUpdateOperationsInput | string | null
    bhyt?: NullableStringFieldUpdateOperationsInput | string | null
    tuVanVienMa?: NullableStringFieldUpdateOperationsInput | string | null
    soTienBao?: NullableFloatFieldUpdateOperationsInput | number | null
    ngayDieuTri?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    diemDon?: NullableStringFieldUpdateOperationsInput | string | null
    gioDon?: NullableStringFieldUpdateOperationsInput | string | null
    nhom?: NullableStringFieldUpdateOperationsInput | string | null
    followUpStatus?: NullableStringFieldUpdateOperationsInput | string | null
    nguoiChotCuoiMa?: NullableStringFieldUpdateOperationsInput | string | null
    ngayChot?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    daDon?: BoolFieldUpdateOperationsInput | boolean
    ngayMoThucTe?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    soTienThucThu?: NullableFloatFieldUpdateOperationsInput | number | null
    trangThaiDieuTri?: NullableStringFieldUpdateOperationsInput | string | null
    ngayTaiKham?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    ghiChuMat2?: NullableStringFieldUpdateOperationsInput | string | null
    trangThai?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    updatedBy?: NullableStringFieldUpdateOperationsInput | string | null
    syncStatus?: StringFieldUpdateOperationsInput | string
  }

  export type HoSoBenhNhanUpdateWithoutNguoiChotCuoiInput = {
    id?: StringFieldUpdateOperationsInput | string
    maBN?: StringFieldUpdateOperationsInput | string
    maBNHIS?: NullableStringFieldUpdateOperationsInput | string | null
    stt?: IntFieldUpdateOperationsInput | number
    hoTen?: StringFieldUpdateOperationsInput | string
    gioiTinh?: StringFieldUpdateOperationsInput | string
    ngaySinh?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    namSinh?: IntFieldUpdateOperationsInput | number
    cccd?: NullableStringFieldUpdateOperationsInput | string | null
    diaChi?: NullableStringFieldUpdateOperationsInput | string | null
    sdt?: NullableStringFieldUpdateOperationsInput | string | null
    sdtNguoiNha?: NullableStringFieldUpdateOperationsInput | string | null
    thiLucMP?: NullableStringFieldUpdateOperationsInput | string | null
    thiLucMT?: NullableStringFieldUpdateOperationsInput | string | null
    chanDoan?: StringFieldUpdateOperationsInput | string
    chanDoanKhac?: NullableStringFieldUpdateOperationsInput | string | null
    khuyenNghi?: NullableStringFieldUpdateOperationsInput | string | null
    bhyt?: NullableStringFieldUpdateOperationsInput | string | null
    soTienBao?: NullableFloatFieldUpdateOperationsInput | number | null
    ngayDieuTri?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    diemDon?: NullableStringFieldUpdateOperationsInput | string | null
    gioDon?: NullableStringFieldUpdateOperationsInput | string | null
    nhom?: NullableStringFieldUpdateOperationsInput | string | null
    followUpStatus?: NullableStringFieldUpdateOperationsInput | string | null
    ngayChot?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    daDon?: BoolFieldUpdateOperationsInput | boolean
    ngayMoThucTe?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    soTienThucThu?: NullableFloatFieldUpdateOperationsInput | number | null
    trangThaiDieuTri?: NullableStringFieldUpdateOperationsInput | string | null
    ngayTaiKham?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    ghiChuMat2?: NullableStringFieldUpdateOperationsInput | string | null
    trangThai?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    updatedBy?: NullableStringFieldUpdateOperationsInput | string | null
    syncStatus?: StringFieldUpdateOperationsInput | string
    buoiKham?: BuoiKhamUpdateOneRequiredWithoutHoSoNestedInput
    coSo?: CoSoUpdateOneRequiredWithoutHoSoNestedInput
    tuVanVien?: NguoiDungCSRUpdateOneWithoutHoSoTuVanNestedInput
    nguoiPhuTrach?: NguoiDungCSRUpdateOneWithoutHoSoPhuTrachNestedInput
    nhatKy?: NhatKyTheoDoiUpdateManyWithoutHoSoNestedInput
  }

  export type HoSoBenhNhanUncheckedUpdateWithoutNguoiChotCuoiInput = {
    id?: StringFieldUpdateOperationsInput | string
    maBN?: StringFieldUpdateOperationsInput | string
    maBNHIS?: NullableStringFieldUpdateOperationsInput | string | null
    stt?: IntFieldUpdateOperationsInput | number
    buoiKhamId?: StringFieldUpdateOperationsInput | string
    coSoId?: StringFieldUpdateOperationsInput | string
    hoTen?: StringFieldUpdateOperationsInput | string
    gioiTinh?: StringFieldUpdateOperationsInput | string
    ngaySinh?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    namSinh?: IntFieldUpdateOperationsInput | number
    cccd?: NullableStringFieldUpdateOperationsInput | string | null
    diaChi?: NullableStringFieldUpdateOperationsInput | string | null
    sdt?: NullableStringFieldUpdateOperationsInput | string | null
    sdtNguoiNha?: NullableStringFieldUpdateOperationsInput | string | null
    thiLucMP?: NullableStringFieldUpdateOperationsInput | string | null
    thiLucMT?: NullableStringFieldUpdateOperationsInput | string | null
    chanDoan?: StringFieldUpdateOperationsInput | string
    chanDoanKhac?: NullableStringFieldUpdateOperationsInput | string | null
    khuyenNghi?: NullableStringFieldUpdateOperationsInput | string | null
    bhyt?: NullableStringFieldUpdateOperationsInput | string | null
    tuVanVienMa?: NullableStringFieldUpdateOperationsInput | string | null
    soTienBao?: NullableFloatFieldUpdateOperationsInput | number | null
    ngayDieuTri?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    diemDon?: NullableStringFieldUpdateOperationsInput | string | null
    gioDon?: NullableStringFieldUpdateOperationsInput | string | null
    nhom?: NullableStringFieldUpdateOperationsInput | string | null
    followUpStatus?: NullableStringFieldUpdateOperationsInput | string | null
    nguoiPhuTrachMa?: NullableStringFieldUpdateOperationsInput | string | null
    ngayChot?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    daDon?: BoolFieldUpdateOperationsInput | boolean
    ngayMoThucTe?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    soTienThucThu?: NullableFloatFieldUpdateOperationsInput | number | null
    trangThaiDieuTri?: NullableStringFieldUpdateOperationsInput | string | null
    ngayTaiKham?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    ghiChuMat2?: NullableStringFieldUpdateOperationsInput | string | null
    trangThai?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    updatedBy?: NullableStringFieldUpdateOperationsInput | string | null
    syncStatus?: StringFieldUpdateOperationsInput | string
    nhatKy?: NhatKyTheoDoiUncheckedUpdateManyWithoutHoSoNestedInput
  }

  export type HoSoBenhNhanUncheckedUpdateManyWithoutNguoiChotCuoiInput = {
    id?: StringFieldUpdateOperationsInput | string
    maBN?: StringFieldUpdateOperationsInput | string
    maBNHIS?: NullableStringFieldUpdateOperationsInput | string | null
    stt?: IntFieldUpdateOperationsInput | number
    buoiKhamId?: StringFieldUpdateOperationsInput | string
    coSoId?: StringFieldUpdateOperationsInput | string
    hoTen?: StringFieldUpdateOperationsInput | string
    gioiTinh?: StringFieldUpdateOperationsInput | string
    ngaySinh?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    namSinh?: IntFieldUpdateOperationsInput | number
    cccd?: NullableStringFieldUpdateOperationsInput | string | null
    diaChi?: NullableStringFieldUpdateOperationsInput | string | null
    sdt?: NullableStringFieldUpdateOperationsInput | string | null
    sdtNguoiNha?: NullableStringFieldUpdateOperationsInput | string | null
    thiLucMP?: NullableStringFieldUpdateOperationsInput | string | null
    thiLucMT?: NullableStringFieldUpdateOperationsInput | string | null
    chanDoan?: StringFieldUpdateOperationsInput | string
    chanDoanKhac?: NullableStringFieldUpdateOperationsInput | string | null
    khuyenNghi?: NullableStringFieldUpdateOperationsInput | string | null
    bhyt?: NullableStringFieldUpdateOperationsInput | string | null
    tuVanVienMa?: NullableStringFieldUpdateOperationsInput | string | null
    soTienBao?: NullableFloatFieldUpdateOperationsInput | number | null
    ngayDieuTri?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    diemDon?: NullableStringFieldUpdateOperationsInput | string | null
    gioDon?: NullableStringFieldUpdateOperationsInput | string | null
    nhom?: NullableStringFieldUpdateOperationsInput | string | null
    followUpStatus?: NullableStringFieldUpdateOperationsInput | string | null
    nguoiPhuTrachMa?: NullableStringFieldUpdateOperationsInput | string | null
    ngayChot?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    daDon?: BoolFieldUpdateOperationsInput | boolean
    ngayMoThucTe?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    soTienThucThu?: NullableFloatFieldUpdateOperationsInput | number | null
    trangThaiDieuTri?: NullableStringFieldUpdateOperationsInput | string | null
    ngayTaiKham?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    ghiChuMat2?: NullableStringFieldUpdateOperationsInput | string | null
    trangThai?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    updatedBy?: NullableStringFieldUpdateOperationsInput | string | null
    syncStatus?: StringFieldUpdateOperationsInput | string
  }

  export type NhatKyTheoDoiUpdateWithoutNguoiGoiInput = {
    id?: StringFieldUpdateOperationsInput | string
    ngay?: DateTimeFieldUpdateOperationsInput | Date | string
    noiDung?: StringFieldUpdateOperationsInput | string
    syncStatus?: StringFieldUpdateOperationsInput | string
    hoSo?: HoSoBenhNhanUpdateOneRequiredWithoutNhatKyNestedInput
  }

  export type NhatKyTheoDoiUncheckedUpdateWithoutNguoiGoiInput = {
    id?: StringFieldUpdateOperationsInput | string
    hoSoId?: StringFieldUpdateOperationsInput | string
    ngay?: DateTimeFieldUpdateOperationsInput | Date | string
    noiDung?: StringFieldUpdateOperationsInput | string
    syncStatus?: StringFieldUpdateOperationsInput | string
  }

  export type NhatKyTheoDoiUncheckedUpdateManyWithoutNguoiGoiInput = {
    id?: StringFieldUpdateOperationsInput | string
    hoSoId?: StringFieldUpdateOperationsInput | string
    ngay?: DateTimeFieldUpdateOperationsInput | Date | string
    noiDung?: StringFieldUpdateOperationsInput | string
    syncStatus?: StringFieldUpdateOperationsInput | string
  }

  export type HoSoBenhNhanCreateManyBuoiKhamInput = {
    id?: string
    maBN: string
    maBNHIS?: string | null
    stt: number
    coSoId: string
    hoTen: string
    gioiTinh: string
    ngaySinh?: Date | string | null
    namSinh: number
    cccd?: string | null
    diaChi?: string | null
    sdt?: string | null
    sdtNguoiNha?: string | null
    thiLucMP?: string | null
    thiLucMT?: string | null
    chanDoan?: string
    chanDoanKhac?: string | null
    khuyenNghi?: string | null
    bhyt?: string | null
    tuVanVienMa?: string | null
    soTienBao?: number | null
    ngayDieuTri?: Date | string | null
    diemDon?: string | null
    gioDon?: string | null
    nhom?: string | null
    followUpStatus?: string | null
    nguoiPhuTrachMa?: string | null
    nguoiChotCuoiMa?: string | null
    ngayChot?: Date | string | null
    daDon?: boolean
    ngayMoThucTe?: Date | string | null
    soTienThucThu?: number | null
    trangThaiDieuTri?: string | null
    ngayTaiKham?: Date | string | null
    ghiChuMat2?: string | null
    trangThai?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    createdBy?: string | null
    updatedBy?: string | null
    syncStatus?: string
  }

  export type HoSoBenhNhanUpdateWithoutBuoiKhamInput = {
    id?: StringFieldUpdateOperationsInput | string
    maBN?: StringFieldUpdateOperationsInput | string
    maBNHIS?: NullableStringFieldUpdateOperationsInput | string | null
    stt?: IntFieldUpdateOperationsInput | number
    hoTen?: StringFieldUpdateOperationsInput | string
    gioiTinh?: StringFieldUpdateOperationsInput | string
    ngaySinh?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    namSinh?: IntFieldUpdateOperationsInput | number
    cccd?: NullableStringFieldUpdateOperationsInput | string | null
    diaChi?: NullableStringFieldUpdateOperationsInput | string | null
    sdt?: NullableStringFieldUpdateOperationsInput | string | null
    sdtNguoiNha?: NullableStringFieldUpdateOperationsInput | string | null
    thiLucMP?: NullableStringFieldUpdateOperationsInput | string | null
    thiLucMT?: NullableStringFieldUpdateOperationsInput | string | null
    chanDoan?: StringFieldUpdateOperationsInput | string
    chanDoanKhac?: NullableStringFieldUpdateOperationsInput | string | null
    khuyenNghi?: NullableStringFieldUpdateOperationsInput | string | null
    bhyt?: NullableStringFieldUpdateOperationsInput | string | null
    soTienBao?: NullableFloatFieldUpdateOperationsInput | number | null
    ngayDieuTri?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    diemDon?: NullableStringFieldUpdateOperationsInput | string | null
    gioDon?: NullableStringFieldUpdateOperationsInput | string | null
    nhom?: NullableStringFieldUpdateOperationsInput | string | null
    followUpStatus?: NullableStringFieldUpdateOperationsInput | string | null
    ngayChot?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    daDon?: BoolFieldUpdateOperationsInput | boolean
    ngayMoThucTe?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    soTienThucThu?: NullableFloatFieldUpdateOperationsInput | number | null
    trangThaiDieuTri?: NullableStringFieldUpdateOperationsInput | string | null
    ngayTaiKham?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    ghiChuMat2?: NullableStringFieldUpdateOperationsInput | string | null
    trangThai?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    updatedBy?: NullableStringFieldUpdateOperationsInput | string | null
    syncStatus?: StringFieldUpdateOperationsInput | string
    coSo?: CoSoUpdateOneRequiredWithoutHoSoNestedInput
    tuVanVien?: NguoiDungCSRUpdateOneWithoutHoSoTuVanNestedInput
    nguoiPhuTrach?: NguoiDungCSRUpdateOneWithoutHoSoPhuTrachNestedInput
    nguoiChotCuoi?: NguoiDungCSRUpdateOneWithoutHoSoChotCuoiNestedInput
    nhatKy?: NhatKyTheoDoiUpdateManyWithoutHoSoNestedInput
  }

  export type HoSoBenhNhanUncheckedUpdateWithoutBuoiKhamInput = {
    id?: StringFieldUpdateOperationsInput | string
    maBN?: StringFieldUpdateOperationsInput | string
    maBNHIS?: NullableStringFieldUpdateOperationsInput | string | null
    stt?: IntFieldUpdateOperationsInput | number
    coSoId?: StringFieldUpdateOperationsInput | string
    hoTen?: StringFieldUpdateOperationsInput | string
    gioiTinh?: StringFieldUpdateOperationsInput | string
    ngaySinh?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    namSinh?: IntFieldUpdateOperationsInput | number
    cccd?: NullableStringFieldUpdateOperationsInput | string | null
    diaChi?: NullableStringFieldUpdateOperationsInput | string | null
    sdt?: NullableStringFieldUpdateOperationsInput | string | null
    sdtNguoiNha?: NullableStringFieldUpdateOperationsInput | string | null
    thiLucMP?: NullableStringFieldUpdateOperationsInput | string | null
    thiLucMT?: NullableStringFieldUpdateOperationsInput | string | null
    chanDoan?: StringFieldUpdateOperationsInput | string
    chanDoanKhac?: NullableStringFieldUpdateOperationsInput | string | null
    khuyenNghi?: NullableStringFieldUpdateOperationsInput | string | null
    bhyt?: NullableStringFieldUpdateOperationsInput | string | null
    tuVanVienMa?: NullableStringFieldUpdateOperationsInput | string | null
    soTienBao?: NullableFloatFieldUpdateOperationsInput | number | null
    ngayDieuTri?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    diemDon?: NullableStringFieldUpdateOperationsInput | string | null
    gioDon?: NullableStringFieldUpdateOperationsInput | string | null
    nhom?: NullableStringFieldUpdateOperationsInput | string | null
    followUpStatus?: NullableStringFieldUpdateOperationsInput | string | null
    nguoiPhuTrachMa?: NullableStringFieldUpdateOperationsInput | string | null
    nguoiChotCuoiMa?: NullableStringFieldUpdateOperationsInput | string | null
    ngayChot?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    daDon?: BoolFieldUpdateOperationsInput | boolean
    ngayMoThucTe?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    soTienThucThu?: NullableFloatFieldUpdateOperationsInput | number | null
    trangThaiDieuTri?: NullableStringFieldUpdateOperationsInput | string | null
    ngayTaiKham?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    ghiChuMat2?: NullableStringFieldUpdateOperationsInput | string | null
    trangThai?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    updatedBy?: NullableStringFieldUpdateOperationsInput | string | null
    syncStatus?: StringFieldUpdateOperationsInput | string
    nhatKy?: NhatKyTheoDoiUncheckedUpdateManyWithoutHoSoNestedInput
  }

  export type HoSoBenhNhanUncheckedUpdateManyWithoutBuoiKhamInput = {
    id?: StringFieldUpdateOperationsInput | string
    maBN?: StringFieldUpdateOperationsInput | string
    maBNHIS?: NullableStringFieldUpdateOperationsInput | string | null
    stt?: IntFieldUpdateOperationsInput | number
    coSoId?: StringFieldUpdateOperationsInput | string
    hoTen?: StringFieldUpdateOperationsInput | string
    gioiTinh?: StringFieldUpdateOperationsInput | string
    ngaySinh?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    namSinh?: IntFieldUpdateOperationsInput | number
    cccd?: NullableStringFieldUpdateOperationsInput | string | null
    diaChi?: NullableStringFieldUpdateOperationsInput | string | null
    sdt?: NullableStringFieldUpdateOperationsInput | string | null
    sdtNguoiNha?: NullableStringFieldUpdateOperationsInput | string | null
    thiLucMP?: NullableStringFieldUpdateOperationsInput | string | null
    thiLucMT?: NullableStringFieldUpdateOperationsInput | string | null
    chanDoan?: StringFieldUpdateOperationsInput | string
    chanDoanKhac?: NullableStringFieldUpdateOperationsInput | string | null
    khuyenNghi?: NullableStringFieldUpdateOperationsInput | string | null
    bhyt?: NullableStringFieldUpdateOperationsInput | string | null
    tuVanVienMa?: NullableStringFieldUpdateOperationsInput | string | null
    soTienBao?: NullableFloatFieldUpdateOperationsInput | number | null
    ngayDieuTri?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    diemDon?: NullableStringFieldUpdateOperationsInput | string | null
    gioDon?: NullableStringFieldUpdateOperationsInput | string | null
    nhom?: NullableStringFieldUpdateOperationsInput | string | null
    followUpStatus?: NullableStringFieldUpdateOperationsInput | string | null
    nguoiPhuTrachMa?: NullableStringFieldUpdateOperationsInput | string | null
    nguoiChotCuoiMa?: NullableStringFieldUpdateOperationsInput | string | null
    ngayChot?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    daDon?: BoolFieldUpdateOperationsInput | boolean
    ngayMoThucTe?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    soTienThucThu?: NullableFloatFieldUpdateOperationsInput | number | null
    trangThaiDieuTri?: NullableStringFieldUpdateOperationsInput | string | null
    ngayTaiKham?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    ghiChuMat2?: NullableStringFieldUpdateOperationsInput | string | null
    trangThai?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    updatedBy?: NullableStringFieldUpdateOperationsInput | string | null
    syncStatus?: StringFieldUpdateOperationsInput | string
  }

  export type NhatKyTheoDoiCreateManyHoSoInput = {
    id?: string
    ngay: Date | string
    nguoiGoiMa: string
    noiDung: string
    syncStatus?: string
  }

  export type NhatKyTheoDoiUpdateWithoutHoSoInput = {
    id?: StringFieldUpdateOperationsInput | string
    ngay?: DateTimeFieldUpdateOperationsInput | Date | string
    noiDung?: StringFieldUpdateOperationsInput | string
    syncStatus?: StringFieldUpdateOperationsInput | string
    nguoiGoi?: NguoiDungCSRUpdateOneRequiredWithoutNhatKyNestedInput
  }

  export type NhatKyTheoDoiUncheckedUpdateWithoutHoSoInput = {
    id?: StringFieldUpdateOperationsInput | string
    ngay?: DateTimeFieldUpdateOperationsInput | Date | string
    nguoiGoiMa?: StringFieldUpdateOperationsInput | string
    noiDung?: StringFieldUpdateOperationsInput | string
    syncStatus?: StringFieldUpdateOperationsInput | string
  }

  export type NhatKyTheoDoiUncheckedUpdateManyWithoutHoSoInput = {
    id?: StringFieldUpdateOperationsInput | string
    ngay?: DateTimeFieldUpdateOperationsInput | Date | string
    nguoiGoiMa?: StringFieldUpdateOperationsInput | string
    noiDung?: StringFieldUpdateOperationsInput | string
    syncStatus?: StringFieldUpdateOperationsInput | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}