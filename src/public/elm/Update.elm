module Update exposing (Msg(..), update)

import List exposing (filter, append)
import Json.Decode exposing (..)
import Port exposing (..)
import Model exposing (..)


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


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        StatusesTimeline response ->
            let
                decoded =
                    decodeStatuses response
            in
                case decoded of
                    Ok statuses ->
                        ( { model | statuses = statuses }, Cmd.none )

                    Err error ->
                        ( { model | error = error }, Cmd.none )

        StatusesUpdate response ->
            let
                decoded =
                    decodeStatus response
            in
                case decoded of
                    Ok status ->
                        ( { model | statuses = append model.statuses [ status ] }, Cmd.none )

                    Err error ->
                        ( { model | error = error }, Cmd.none )

        Users response ->
            let
                decoded =
                    decodeUsers response
            in
                case decoded of
                    Ok users ->
                        ( { model | users = users }, Cmd.none )

                    Err error ->
                        ( { model | error = error }, Cmd.none )

        UsersUpdate response ->
            let
                decoded =
                    decodeUser response
            in
                case decoded of
                    Ok user ->
                        ( { model | users = append model.users [ user ] }, Cmd.none )

                    Err error ->
                        ( { model | error = error }, Cmd.none )

        Account response ->
            let
                decoded =
                    decodeUser response
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
                name =
                    model.temp.name

                screenName =
                    model.temp.screen_name
            in
                ( { model | temp = Temp "" "" model.temp.message model.temp.search, page = "/" }, Cmd.batch [ accountUpdateName name, accountUpdateScreenName screenName, accountUpdateImage () ] )

        AccountUpdateProfile response ->
            let
                decoded =
                    decodeUser response
            in
                case decoded of
                    Ok user ->
                        ( { model | users = append (filter (\u -> u.id /= user.id) model.users) [ user ] }, Cmd.none )

                    Err error ->
                        ( { model | error = error }, Cmd.none )

        SendMessage ->
            ( { model | temp = Temp model.temp.name model.temp.screen_name "" model.temp.search }
            , if model.temp.message /= "" then
                sendMessage model.temp.message
              else
                Cmd.none
            )

        ChangePage page ->
            ( { model | page = page }, Cmd.none )

        InputMessage input ->
            ( { model | temp = Temp model.temp.name model.temp.screen_name input model.temp.search }, Cmd.none )

        InputSearchWord input ->
            ( { model | temp = Temp model.temp.name model.temp.screen_name model.temp.message input }, Cmd.none )


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
