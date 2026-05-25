## Auth

- Swagger OAuth2 login mismatch (JSON vs OAuth2 form)
- Replace hardcoded JWT secret with generated secret
- Replace development credentials
- Clean up Alembic migration history
- Review bcrypt/passlib version pinning
- Add automated tests for auth flow

## Security / RBAC

- Swagger OAuth2 authorization flow mismatch.
- Roles table is not seeded.
- Permissions table is not seeded.
- Default role-permission mappings are not seeded.
- Setup initialization should create default RBAC data.

## Archival Testing

- ArchiveEntryRead returns empty tag_ids/developer_ids/publisher_ids/collection_ids despite relationships being correctly populated.
