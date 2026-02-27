import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeResponsibleLinkOptional1739850000000 implements MigrationInterface {
  name = 'MakeResponsibleLinkOptional1739850000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "event_requests"
      ALTER COLUMN "responsibleLink" DROP NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "events"
      ALTER COLUMN "responsibleLink" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "event_requests"
      ALTER COLUMN "responsibleLink" SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "events"
      ALTER COLUMN "responsibleLink" SET NOT NULL
    `);
  }
}
