# tech-challenge-orders-project

Project Tech Challenge Group 62

## Descrição

Este projeto contempla um sistema para gerenciamento de pagamentos.
## Tecnologia

TypeScript: 5.2.2
![Linkedin: HelioSoares](https://shields.io/badge/TypeScript-3178C6?logo=TypeScript&logoColor=FFF&style=flat-square)

Node: 20.2.1
![Linkedin: HelioSoares](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)

## Relatório de Impacto à Proteção de Dados Pessoais

[ripd](https://youtu.be/5ypeCH3Io_s](https://docs.google.com/document/d/1tj5SuWZX0O2eXeLHcBnM3qHz9IN51dWT/edit?usp=sharing&ouid=118087082707471708573&rtpof=true&sd=true)

[documentação de base]((https://docs.google.com/document/d/1tj5SuWZX0O2eXeLHcBnM3qHz9IN51dWT/edit?usp=sharing&ouid=118087082707471708573&rtpof=true&sd=true))

## Desenvolvimento

O desenvolvimento se deu por meio de Pair programming, onde os atores e ouvintes definidos([documentação de base](https://docs.google.com/document/d/1T5h---6pFPUxed4JcuHohJVm-L-NUCaBk-LMAonPDmI/edit?usp=sharing)), implementaram e testaram os cenários encontrados no Tech challenge.
## Arquitetura

### Video explicativo
[Video explicativo]()

### Desenho de Arquitetura

![arquitetura-fase5](https://github.com/user-attachments/assets/c8601b48-65a2-448c-b251-63536e7d5b2c)


## Deploy

Para rodar o projeto você precisa configurar o arquivo .env, utilizando como base o .env.example.

Exemplo:
```env
    DB_HOST=127.0.0.1
    DB_USER=vms
    DB_PASSWORD=
    DB_NAME_PAYMENTS=vmsdb
    DB_PORT=3306
    APP_PORT=3001
    APP_HOST=0.0.0.0
    NODE_ENV=dev
    ORDER_MS_HOST=http://127.0.0.1:3000
```


### Docker

Para execução via docker

```bash
  docker-compose up
```

## Ordem de execução

Para a execução indicamos criar um item e um pedido afim de ter massas de teste. Estes endpoints estão descritos dentro do arquivo Postman:

1 - Criar item:
```
    Postman -> Order -> Create
```

2 - Criar Pedido:
```
    Postman -> Items -> Create
```

## Swagger

http://localhost:3000/docs
## Postman

[Collection para teste](https://github.com/denilsonos/tech-challenge-orders-project-ms-payment/blob/main/MS%20Payment.postman_collection.json)

## Evidencia de cobertura de testes

![ms-payment](https://github.com/denilsonos/tech-challenge-orders-project-ms-payment/assets/23120172/04272a8a-1017-4255-882b-aefd3356b049)




