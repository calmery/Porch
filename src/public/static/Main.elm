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
    ( Model "/" "", Cmd.batch [ setTitle "Porch" ] )


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
