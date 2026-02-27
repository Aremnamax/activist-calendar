import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRevisionSnapshot1739780000000 implements MigrationInterface {
  name = 'AddRevisionSnapshot1739780000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "event_requests"
      ADD COLUMN IF NOT EXISTS "revisionSnapshot" json
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "event_requests" DROP COLUMN IF EXISTS "revisionSnapshot"`);
  }
}
