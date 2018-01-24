module Main exposing (..)

import Html exposing (program)
import Model exposing (Model, initialModel)
import Port exposing (..)
import Update exposing (Msg(..), update)
import View exposing (view)


init : ( Model, Cmd Msg )
init =
    ( initialModel, Cmd.batch [ setTitle "Conversation - Porch" ] )


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
