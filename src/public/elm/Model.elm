module Model exposing (Model, initialModel, Status, User, Temp, Style)


initialModel : Model
initialModel =
    Model [] [] (User "" "" "" "" "") "" (Temp "" "" "" "") "/" (Style "23px" "55px" "55px") 0


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

type alias Style =
  { chatInputTextarea : String
  , chatInput : String
  , chat : String
  }

type alias Model =
    { statuses : List Status
    , users : List User
    , account : User
    , error : String
    , temp : Temp
    , page : String
    , styles : Style
    , command : Int
    }
