port module Main exposing (..)

import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import Json.Decode


port setTitle : String -> Cmd msg


port sendMail : String -> Cmd msg


port completeMail : (String -> msg) -> Sub msg


type alias Model =
    { page : String
    , mail : String
    }


type Msg
    = ChangePage String
    | CompleteMail String
    | SendMail
    | InputMail String
    | CheckCommand Int


init : ( Model, Cmd Msg )
init =
    ( Model "/" "", Cmd.batch [ setTitle "Conversation - Porch" ] )


createIndexPage : Model -> List (Html Msg)
createIndexPage model =
    [ div [ id "screen" ]
        [ div [ id "keywords" ]
            [ text "Simple real-time chat with WebSocket." ]
        , div [ onClick <| ChangePage "/login", id "button" ]
            [ text "Send magic sign-in link" ]
        , div [ id "image" ]
            [ img [ src "img/app.png" ]
                []
            ]
        ]
    , div [ id "contents" ]
        [ div [ class "content label" ]
            [ text "Technologies used" ]
        , div [ class "content" ]
            [ a [ href "https://www.docker.com/" ]
                [ text "Docker" ]
            , a [ href "https://nodejs.org/ja/" ]
                [ text "Node.js" ]
            , a [ href "https://redis.io/" ]
                [ text "Redis" ]
            ]
        , div [ class "content label" ]
            [ text "Libraries used" ]
        , div [ class "content" ]
            [ a [ href "https://github.com/expressjs/body-parser" ]
                [ text "body-parser" ]
            , a [ href "https://github.com/tj/connect-redis" ]
                [ text "connect-redis" ]
            , a [ href "https://github.com/expressjs/cookie-parser" ]
                [ text "cookie-parser" ]
            , a [ href "https://github.com/eleith/emailjs" ]
                [ text "emailjs" ]
            , a [ href "http://expressjs.com/ja/" ]
                [ text "express" ]
            , a [ href "https://github.com/expressjs/session" ]
                [ text "express-session" ]
            , a [ href "https://github.com/oskosk/express-socket.io-session" ]
                [ text "express-socket.io-session" ]
            , div [ attribute "style" "height: 5px; width: 100%" ]
                []
            , a [ href "https://passwordless.net/" ]
                [ text "passwordless" ]
            , a [ href "https://github.com/florianheinemann/passwordless-redisstore" ]
                [ text "passwordless-redisstore" ]
            , a [ href "https://github.com/NodeRedis/node_redis" ]
                [ text "redis" ]
            , a [ href "https://socket.io/" ]
                [ text "socket.io" ]
            ]
        ]
    , div [ id "footer" ]
        [ text "Small Porch is built with "
        , span [ attribute "style" "font-family: Condense; color: #C1414D;" ]
            [ text "—" ]
        , text "by Marei Kikukawa"
        ]
    ]


onKeyDown : (Int -> msg) -> Attribute msg
onKeyDown tagger =
    Html.Events.on "keydown" (Json.Decode.map tagger Html.Events.keyCode)


createLoginPage : Model -> Html Msg
createLoginPage model =
    div [ id "screen", attribute "style" "height: auto; padding-bottom: 50px;" ]
        [ div [ id "keywords" ]
            [ text "Send magic sign-in link to your email address" ]
        , div [ id "input" ]
            [ textarea [ onInput InputMail, onKeyDown CheckCommand, id "email", placeholder "Please enter your email address" ]
                []
            ]
        , div [ onClick SendMail, id "button", attribute "style" "text-align: center; width: 100px; font-size: 15px; padding: 10px 0;" ]
            [ text "Send" ]
        ]


view : Model -> Html Msg
view model =
    section [ id "main" ]
        ([ header [ class "clearfix", id "header" ]
            ([ div [ id "title" ]
                [ text "Small Porch" ]
             , a [ href "https://github.com/calmery/Porch" ]
                [ div [ id "github" ]
                    [ img [ src "img/github.png" ]
                        []
                    ]
                ]
             ]
                ++ (if model.page == "/" then
                        [ div [ onClick <| ChangePage "/login", class "menu", attribute "style" "float: right; margin-left: 0;margin-right: 25px;" ]
                            [ text "Sign in" ]
                        ]
                    else
                        []
                   )
            )
         ]
            ++ (if model.page == "/" then
                    createIndexPage model
                else if model.page == "/login" then
                    [ createLoginPage model ]
                else
                    [ text "" ]
               )
        )


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        ChangePage page ->
            ( { model | page = page }, Cmd.none )

        CompleteMail _ ->
            update (ChangePage "/") model

        SendMail ->
            ( model, sendMail model.mail )

        InputMail input ->
            ( { model | mail = input }, Cmd.none )

        CheckCommand command ->
            if command == 13 then
                update SendMail model
            else
                ( model, Cmd.none )


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.batch
        [ completeMail CompleteMail
        ]


main : Program Never Model Msg
main =
    program
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        }
