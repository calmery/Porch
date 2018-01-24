module Model exposing (Model, initialModel, Status, User, Temp)


initialModel =
    Model [] [] (User "" "" "" "" "") "" (Temp "" "" "" "") "/"


type alias Status =
    { text : String
    , created_at : String
    , user : String
    }


type alias User =
    { id : String
    , screen_name : String
    , name : String
    , created_at : String
    , profile_image_url : String
    }


type alias Temp =
    { name : String
    , screen_name : String
    , message : String
    , search : String
    }


type alias Model =
    { statuses : List Status
    , users : List User
    , account : User
    , error : String
    , temp : Temp
    , page : String
    }
