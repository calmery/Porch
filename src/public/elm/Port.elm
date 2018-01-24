port module Port exposing (..)

--  Title


port setTitle : String -> Cmd msg



-- Timeline


port statusesTimeline : (String -> msg) -> Sub msg


port statusesUpdate : (String -> msg) -> Sub msg



-- Send Message


port sendMessage : String -> Cmd msg



-- User


port users : (String -> msg) -> Sub msg


port usersUpdate : (String -> msg) -> Sub msg



-- My Account


port account : (String -> msg) -> Sub msg


port accountUpdateProfile : (String -> msg) -> Sub msg


port accountUpdateName : String -> Cmd msg


port accountUpdateScreenName : String -> Cmd msg


port accountUpdateImage : () -> Cmd msg
