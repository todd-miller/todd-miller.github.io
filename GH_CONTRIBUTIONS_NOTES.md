# GhContributions re-enable notes

## Counting line changes in git history

Total lines added/deleted by an author across all history:

```sh
git log --author="todd miller" --pretty=tformat: --numstat \
  | awk '{add+=$1; del+=$2} END {printf "added %d, deleted %d, net %d\n", add, del, add-del}'
```

- Drop `--author=...` for all contributors.
- Add `-- 'path/'` at the end to scope to a subdirectory.
- Add `--since=2025-01-01` (or `--until=...`) for a time range.
- Binary files show as `-` in numstat and are skipped by the awk sum.
