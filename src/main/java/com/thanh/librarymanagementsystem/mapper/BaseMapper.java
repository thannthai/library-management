package com.thanh.librarymanagementsystem.mapper;

import org.mapstruct.*;

import java.util.List;

public interface BaseMapper<REQ, RES, ENTITY> {
    ENTITY toEntity(REQ d);

    RES toDTO(ENTITY e);

    List<ENTITY> toEntity(List<REQ> d);

    List<RES> toDTO(List<ENTITY> e);

    @Mapping(target = "id", ignore = true)
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateEntity(REQ dto, @MappingTarget ENTITY entity);
}
