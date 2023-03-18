# Why would you like to use this project ?

## 1. CQRS

The [CQRS](https://martinfowler.com/bliki/CQRS.html) pattern splits Command actions (mutations actions like CUD of CRUD) from Query actions (read actions like R of CRUD).

To do that you need 2 APIs, one of which implements the "read" part.

This project addresses the latter, in order to quickly create a Query API with little code.

## 2. Business Domain Model vs Persistence Data Model

The persistence is the system by which you store data on the long term.

It can be a SQL database, a document based system, etc... whatever technology.

There is a data model specific to this technology which is often different from your business domain model.

But there is no need to expose to the user the persistence data model.

It has more sense to expose the Business domain model, but it requires some data mapping, which, for a developer, is annoying and time consuming.

This project addresses this problem, by making it easy to map persistence model to business model.

## 3. GraphQL

When you want to fetch data in a REST APIs, you always get the all resource, and the way to provide the params are sometimes non intelligible.

With this project, you can query a resource this way, with a js object

```ts
{
   fields: {
      field_name: true // the field of the resource you want the value
   },
   filters: {
      field_name: { // you can filter on this field_name
         value: 'some value' // matching this value according to the operator of your choice under
         operator: 'equals' | 'greater_than' | 'greater_than_or_equals' | 'lesser_than' | 'lesser_than_or_equals' | 'contains'
      }
      // you can combine other fields by using an array, which can be "and" or "or", according to your logic
   },
   options: {
      offset: 0,
      limit: 10
   },
}
```

You can jump directly to the [examples](https://github.com/j-khong/domain-request/tree/main/examples/)

- a query server running on node
- a query server running on deno

Both serves use the same domains, so the differences between them are just due to node and deno.

For each server, you can generate a client to be run on deno or node. Then whatever client you use (deno or node), you can query both server indifferently.

These are just examples, to help you start quickly.

But you can embed the following package in your own server.

# A package named Domain Request

Domain as in Domain Driven Design

Request as in data request

Domain Request is a package to make custom request of a domain (i.e. to get a fields subset of a domain fields set) independently of 
- the persistence strategy (e.g. database)
- the calling interface (e.g. API)


A classic implementation of data request is a REST API plugged to a database. The REST resource being the Domain. 

The 2 examples mentioned above implement this case.

# Features
## Data request
### Fields selection
Use a simple js object to request the date you want
```ts
{
   fields: { // fields of the resource you want the value
      field_name: true,
      other_field_name: true,
      sub_object:{
         name: true,
         nested_object: {
            value: true
         }
      }
   },
   ...
}
```

### Value filtering
```ts
{
   ...
   filters: {
      field_name: { // you can filter on this field_name
         value: 'some value' // matching this value according to the operator of your choice under
         operator: 'equals' | 'greater_than' | 'greater_than_or_equals' | 'lesser_than' | 'lesser_than_or_equals' | 'contains'
      }
      // you can combine other fields by using an array, which can be "and" or "or", according to your logic
   },
   ...
}
```
### Classic API options
limit, offset, order by
```ts
{
   ...
   options: {
      offset: 0,
      limit: 10
   },
}
```
## ⚠️ WIP Doc under

### Expandable Domains

## User Roles
User roles are managed, so that you can configure 
- access rights by role (e.g. admin role can get all fields but a restricted role can get specified fields only)
- data restriction (e.g. a limited user can get a subset of values of a field only)

## Data mapping


## other

The rationale is : 

The DomainRequestBuilder checks that the external input is correct and then creates a DomainRequest.

Once you have your DomainRequest object, you can pass it to the persistence layer (database only currently) and then get a data object

With the previous example (REST API), 
the external input is the REST url + params.
This format is converted to the format expected by the DomainRequesBuilder.
The DomainRequesBuilder creates the DomainRequest which can be passed to the database layer.
The latter returns a Domain Result which can then be converted into the REST format.




pour la configuration du domain et du mapper DB
- le validateur du filtre doit avoir la meme logique que 
- le convertisseur en champ DB

exemple: si le filtre par champ spécifie un range de nombre (between + tableau à 2 valeurs), le convertisseur en champ DB doit gérer le mapping