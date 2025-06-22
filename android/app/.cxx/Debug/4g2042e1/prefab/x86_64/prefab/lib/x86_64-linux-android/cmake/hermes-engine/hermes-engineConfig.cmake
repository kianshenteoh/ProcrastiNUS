if(NOT TARGET hermes-engine::libhermes)
add_library(hermes-engine::libhermes SHARED IMPORTED)
set_target_properties(hermes-engine::libhermes PROPERTIES
    IMPORTED_LOCATION "C:/Users/kians/.gradle/caches/8.13/transforms/f134d33e9153740e4691fd3da1c6381e/transformed/hermes-android-0.79.3-debug/prefab/modules/libhermes/libs/android.x86_64/libhermes.so"
    INTERFACE_INCLUDE_DIRECTORIES "C:/Users/kians/.gradle/caches/8.13/transforms/f134d33e9153740e4691fd3da1c6381e/transformed/hermes-android-0.79.3-debug/prefab/modules/libhermes/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

