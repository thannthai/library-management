package com.thanh.librarymanagementsystem.mapper;

import com.thanh.librarymanagementsystem.model.User;
import com.thanh.librarymanagementsystem.model.UserProfiles;
import com.thanh.librarymanagementsystem.payload.request.SignUpRequest;
import com.thanh.librarymanagementsystem.payload.response.UserResponse;
import org.mapstruct.AfterMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.springframework.util.StringUtils;

@Mapper(componentModel = "spring")
public abstract class UserMapper implements BaseMapper<SignUpRequest, UserResponse, User> {
    @AfterMapping
    public void handleToEntity(SignUpRequest signUpRequest, @MappingTarget User user) {
        if (StringUtils.hasText(signUpRequest.getFullName()) || StringUtils.hasText(signUpRequest.getPhone())) {
            UserProfiles profiles = new UserProfiles();
            profiles.setFullName(signUpRequest.getFullName());
            profiles.setPhone(signUpRequest.getPhone());
            user.setUserProfiles(profiles);
        }
    }

    @AfterMapping
    public void handleToDTO(User user, @MappingTarget UserResponse response) {
        if (user.getUserProfiles() != null) {
            response.setFullName(user.getUserProfiles().getFullName());
            response.setPhone(user.getUserProfiles().getPhone());
        }
        if (user.getAuthProvider() != null) {
            response.setAuthProvider(user.getAuthProvider().name());
        }
        response.setCreatedAt(user.getCreatedAt());
    }
}
