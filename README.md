# redaktor

A CMS by diesdas.digital.

## Achitecture Idea

CLI : IO (File | Folder) -> List Path

V

Reader : List Path -> List JSON (file system, dropbox, AWS)

V

redaktor : JSON -> String

V

Writer : String -> IO (file system, dropbox, AWS)
