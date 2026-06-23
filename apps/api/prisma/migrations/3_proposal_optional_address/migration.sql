-- Endereco do vendedor deixa de ser coletado: colunas tornam-se opcionais.
ALTER TABLE "proposals" ALTER COLUMN "cep" DROP NOT NULL;
ALTER TABLE "proposals" ALTER COLUMN "city" DROP NOT NULL;
ALTER TABLE "proposals" ALTER COLUMN "neighborhood" DROP NOT NULL;
ALTER TABLE "proposals" ALTER COLUMN "street" DROP NOT NULL;
ALTER TABLE "proposals" ALTER COLUMN "number" DROP NOT NULL;
