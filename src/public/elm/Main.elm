port module Main exposing (..)

import Html exposing (..)
import Html.Events exposing (..)
import Html.Attributes exposing (..)
import List exposing (..)
import Json.Decode exposing (..)

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


type Msg
    = StatusesTimeline String
    | StatusesUpdate String
    | Users String
    | UsersUpdate String
    | Account String
    | AccountUpdateProfile String
    | AccountUpdate
    | AccountNameFieldUpdate String
    | AccountScreenNameFieldUpdate String
    | SendMessage
    | ChangePage String
    | InputMessage String
    | InputSearchWord String


port setTitle : String -> Cmd msg

port statusesTimeline : (String -> msg) -> Sub msg
port statusesUpdate : (String -> msg) -> Sub msg
port sendMessage : String -> Cmd msg


port users : (String -> msg) -> Sub msg
port usersUpdate : (String -> msg) -> Sub msg

port account : (String -> msg) -> Sub msg
port accountUpdateProfile : (String -> msg) -> Sub msg
port accountUpdateName : String -> Cmd msg
port accountUpdateScreenName : String -> Cmd msg
port accountUpdateImage : () -> Cmd msg

-- User

decodeUser : String -> Result String User
decodeUser response =
    decodeString userDecoder response

decodeUsers : String -> Result String (List User)
decodeUsers response =
    decodeString (Json.Decode.list userDecoder) response

userDecoder : Decoder User
userDecoder =
    Json.Decode.map5 User
        (field "id" string)
        (field "screen_name" string)
        (field "name" string)
        (field "created_at" string)
        (field "profile_image_url" string)

-- Status

decodeStatus : String -> Result String Status
decodeStatus response =
    decodeString statusDecoder response

decodeStatuses : String -> Result String (List Status)
decodeStatuses response =
    decodeString (Json.Decode.list statusDecoder) response

statusDecoder : Decoder Status
statusDecoder =
    Json.Decode.map3 Status
        (field "text" string)
        (field "created_at" string)
        (field "user" string)



init : ( Model, Cmd Msg )
init =
    ( Model [] [] (User "" "" "" "" "") "" (Temp "" "" "" "") "/", Cmd.batch [ setTitle "Conversation - Porch" ] )


view : Model -> Html Msg
view model =
    section []
            [ nav [ id "nav" ]
                  [ div [ id "room" ]
                      [ div [ id "room-name" ]
                          [ text "Conversation" ]
                      , div [ id "room-menu-toggle" ]
                          []
                      ]
                  , div [ id "menu" ]
                      [ div [ onClick <| ChangePage "/profile", class <| "menu clearfix menu-official" ++ (if model.page == "/profile" then " selected" else "") ]
                            [ div [ class "menu-official-icon" ]
                                  [ text "˘" ]
                            , div [ class "menu-official-name" ]
                                  [ text "Profile" ]
                            ]
                      , div [ onClick <| ChangePage "/members", class <| "menu clearfix menu-official" ++ (if model.page == "/members" then " selected" else "") ]
                            [ div [ class "menu-official-icon" ]
                                  [ text "¸" ]
                            , div [ class "menu-official-name" ]
                                  [ text "Members" ]
                            ]
                      , div [ class "menu space" ]
                          []
                      , div [ class "menu label clearfix menu-default" ]
                          [ div [ class "menu-default-name" ]
                              [ text "Channels" ]
                          , div [ class "menu-default-icon" ]
                              []
                          ]
                      , div [ onClick <| ChangePage "/", class <| "menu clearfix menu-default" ++ (if model.page == "/" then " selected" else "") ]
                          [ div [ class "menu-default-name" ]
                              [ text "General" ]
                          , div [ class "menu-default-icon" ]
                              []
                          ]
                      , div [ class "menu space" ]
                          []
                      , a [ href "/logout" ]
                          [ div [ class "menu clearfix menu-default", attribute "style" "color: #fff; font-size: 15px" ]
                              [ div [ class "menu-default-name" ]
                                  [ text "Sign out" ]
                              ]
                          ]
                      ]
                  ]
              , if model.page == "/" then
                  createChatPage model
                else if model.page == "/profile" then
                  createProfilePage model
                else if model.page == "/members" then
                  createMembersPage model
                else
                  text ""
              ]


createChatPage : Model -> Html Msg
createChatPage model =
  section [ id "main" ]
    [ header [ id "header" ]
        [ div [ id "channel" ]
            [ text "General" ]
        , div [ id "header-front" ]
            [ div [ id "search" ]
                [ div [ id "search-icon" ]
                    [ text "[" ]
                , textarea [ onInput InputSearchWord, id "search-input", placeholder "Search" ]
                    []
                ]
            , div [ onClick <| ChangePage "/profile", id "profile", attribute "style" "color: #646464;" ]
                    [ div [ id "profile-icon", attribute "style" <| "background: url(" ++ model.account.profile_image_url ++ "); background-size: cover" ]
                        []
                    , div [ id "profile-name" ]
                        [ text model.account.name ]
                    ]
            ]
        ]
    , div [ id "chat" ]
        [ div [ id "messages" ]
            (if model.temp.search == "" then
              (List.map (\status ->

                let
                  u = List.head <| List.filter (\u -> u.id == status.user) model.users
                in
                  case u of
                    Just user ->
                      div [ class "message clearfix" ]
                          [ div [ class "message-icon", attribute "style" <| "background: url( " ++ user.profile_image_url ++ " ); background-size: cover" ]
                              []
                          , div [ class "message-body" ]
                              [ div [ class "message-body-profile clearfix" ]
                                  [ div [ class "message-body-username" ]
                                      [ text user.name ]
                                  , div [ class "message-body-screen_name" ]
                                      [ text <| "@" ++ user.screen_name ]
                                  , div [ class "message-body-time" ]
                                      [ text status.created_at ]
                                  ]
                              , div [ class "message-body-text" ]
                                  [ text status.text ]
                              ]
                          ]
                    Nothing ->
                      text ""

              ) model.statuses)
             else
               (List.map (\status ->

                 let
                   u = List.head <| List.filter (\u -> u.id == status.user) model.users
                 in
                   case u of
                     Just user ->
                       div [ class "message clearfix" ]
                           [ div [ class "message-icon", attribute "style" <| "background: url( " ++ user.profile_image_url ++ " ); background-size: cover" ]
                               []
                           , div [ class "message-body" ]
                               [ div [ class "message-body-profile clearfix" ]
                                   [ div [ class "message-body-username" ]
                                       [ text user.name ]
                                   , div [ class "message-body-screen_name" ]
                                       [ text <| "@" ++ user.screen_name ]
                                   , div [ class "message-body-time" ]
                                       [ text status.created_at ]
                                   ]
                               , div [ class "message-body-text" ]
                                   [ text status.text ]
                               ]
                           ]
                     Nothing ->
                       text ""

               ) <| List.filter (\status -> String.contains model.temp.search status.text) model.statuses)
            )
        , div [ id "chat-input" ]
            [ textarea [ onInput InputMessage, id "chat-input-textarea", placeholder "Message to General", Html.Attributes.value model.temp.message ]
                []
            , div [ onClick SendMessage, id "chat-input-send" ]
                [ text "Send"]
            ]
        ]
    ]

createProfilePage : Model -> Html Msg
createProfilePage model =
  section [ id "main" ]
    [ header [ id "header" ]
        [ div [ id "channel" ]
            [ text "My Profile" ]
        , div [ id "header-front" ]
            [ div [ id "profile" ]
                [ div [ id "profile-icon", attribute "style" <| "background: url(" ++ model.account.profile_image_url ++ "); background-size: cover" ]
                    []
                , div [ id "profile-name" ]
                    [ text model.account.name ]
                ]
            ]
        ]
    , div [ id "chat" ]
        [ div [ class "content" ]
            [ div [ class "content-label" ]
                [ text "Name" ]
            , textarea [ onInput AccountNameFieldUpdate, id "username", placeholder "Name" ]
                []
            ]
        , div [ class "content" ]
            [ div [ class "content-label" ]
                [ text "Screen Name" ]
            , textarea [ onInput AccountScreenNameFieldUpdate, id "screen_name", placeholder "ScreenName" ]
                []
            ]
        , div [ class "content" ]
            [ div [ class "content-label" ]
                [ text "Icon ~500KB" ]
            , input [ accept ".jpg,.gif,.png,image/gif,image/jpeg,image/png", id "image", type_ "file" ]
                []
            ]
        , div [ onClick AccountUpdate, id "submit" ]
            [ text "Update profile" ]
        ]
    ]

createMembersPage : Model -> Html Msg
createMembersPage model =
  section [ id "main" ]
    [ header [ id "header" ]
        [ div [ id "channel" ]
            [ text "Members" ]
        , div [ id "header-front" ]
            [ div [ onClick <| ChangePage "/profile", id "profile", attribute "style" "color: #646464;" ]
                    [ div [ id "profile-icon", attribute "style" <| "background: url(" ++ model.account.profile_image_url ++ "); background-size: cover" ]
                        []
                    , div [ id "profile-name" ]
                        [ text model.account.name ]
                    ]
            ]
        ]
    , div [ id "chat" ]
        [ div [ id "messages" ]
            (List.map (\user ->
              div [ class "message clearfix" ]
                  [ div [ class "message-icon", attribute "style" <| "background: url( " ++ user.profile_image_url ++ " ); background-size: cover" ]
                      []
                  , div [ class "message-body" ]
                      [ div [ class "message-body-profile clearfix" ]
                          [ div [ class "message-body-username", attribute "style" "margin-top: 3px;" ]
                              [ text user.name ]
                          ]
                      , div [ class "message-body-text", attribute "style" "margin-top: 3px;" ]
                          [ text <| "@" ++ user.screen_name ]
                      ]
                  ]
            ) model.users)
        ]
    ]

update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
      StatusesTimeline response ->
        let
          decoded = decodeStatuses response
        in
          case decoded of
            Ok statuses ->
              ( { model | statuses = statuses }, Cmd.none )
            Err error ->
              ( { model | error = error }, Cmd.none )

      StatusesUpdate response ->
        let
          decoded = decodeStatus response
        in
          case decoded of
            Ok status ->
              ( { model | statuses = append model.statuses [status] }, Cmd.none )
            Err error ->
              ( { model | error = error }, Cmd.none )

      Users response ->
        let
          decoded = decodeUsers response
        in
          case decoded of
            Ok users ->
              ( { model | users = users }, Cmd.none )
            Err error ->
              ( { model | error = error }, Cmd.none )

      UsersUpdate response ->
        let
          decoded = decodeUser response
        in
          case decoded of
            Ok user ->
              ( { model | users = append model.users [user] }, Cmd.none )
            Err error ->
              ( { model | error = error }, Cmd.none )

      Account response ->
        let
          decoded = decodeUser response
        in
          case decoded of
            Ok account ->
              ( { model | account = account }, Cmd.none )
            Err error ->
              ( { model | error = error }, Cmd.none )

      AccountNameFieldUpdate name ->
        ( { model | temp = Temp name model.temp.screen_name model.temp.message model.temp.search }, Cmd.none )

      AccountScreenNameFieldUpdate screen_name ->
        ( { model | temp = Temp model.temp.name screen_name model.temp.message model.temp.search }, Cmd.none )

      AccountUpdate ->
        let
          name = model.temp.name
          screenName = model.temp.screen_name
        in
          ( { model | temp = Temp "" "" model.temp.message model.temp.search, page = "/" }, Cmd.batch [ accountUpdateName name, accountUpdateScreenName screenName, accountUpdateImage () ] )

      AccountUpdateProfile response ->
        let
          decoded = decodeUser response
        in
          case decoded of
            Ok user ->
              ( { model | users = append (filter (\u -> u.id /= user.id) model.users) [user] }, Cmd.none )
            Err error ->
              ( { model | error = error }, Cmd.none )

      SendMessage ->
        ( { model | temp = Temp model.temp.name model.temp.screen_name "" model.temp.search }, if model.temp.message /= "" then sendMessage model.temp.message else Cmd.none )

      ChangePage page ->
        ( { model | page = page }, Cmd.none )

      InputMessage input ->
        ( { model | temp = Temp model.temp.name model.temp.screen_name input model.temp.search }, Cmd.none )

      InputSearchWord input ->
        ( { model | temp = Temp model.temp.name model.temp.screen_name model.temp.message input }, Cmd.none )


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.batch
      [ statusesTimeline StatusesTimeline
      , statusesUpdate StatusesUpdate
      , users Users
      , usersUpdate UsersUpdate
      , account Account
      , accountUpdateProfile AccountUpdateProfile
      ]


main : Program Never Model Msg
main =
    program
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        }
